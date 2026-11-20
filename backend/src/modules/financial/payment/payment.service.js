const crypto = require("crypto");

const sequelize =
    require("../../../config/database");

const PaymentRepository =
    require("./payment.repository");

const Invoice =
    require("../invoice/invoice.model");
const InvoiceRepository = require("../invoice/invoice.repository");
const Billing = require('../billing/billing.model');
const Razorpay = require('../../resident-finance/razorpay.service');

const LedgerAccount =
    require("../ledger-account/ledgerAccount.model");

const Account =
    require("../account/account.model");

const AccountingPeriod =
    require("../accounting-period/accountingPeriod.model");

const Journal =
    require("../journal/journal.model");

const JournalLine =
    require("../journal/journalLine.model");

const {
    validateAmount,
    validateSociety,
    validateIdempotencyKey,
    validatePaymentMethod
} = require("./payment.validation");

const toCents = (amount) => Math.round(Number(amount || 0) * 100);


/*
|--------------------------------------------------------------------------
| Generate Payment Reference
|--------------------------------------------------------------------------
*/

const generatePaymentReference = () => {

    const timestamp =
        Date.now();

    const random =
        Math.floor(
            Math.random() * 10000
        );

    return `PAY-${timestamp}-${random}`;
};


/*
|--------------------------------------------------------------------------
| Generate Receipt Number
|--------------------------------------------------------------------------
*/

const generateReceiptNumber = () => {

    return `REC-${Date.now()}-${Math.floor(
        Math.random() * 10000
    )}`;
};


/*
|--------------------------------------------------------------------------
| Verify Webhook Signature
|--------------------------------------------------------------------------
*/

const verifyWebhookSignature = (
    payload,
    signature
) => {

    const secret =
        process.env.PAYMENT_WEBHOOK_SECRET;

    if (!secret) {
        throw new Error(
            "PAYMENT_WEBHOOK_SECRET is not configured"
        );
    }

    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                secret
            )
            .update(
                JSON.stringify(payload)
            )
            .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signature || "");
    if (providedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        providedBuffer
    );
};


/*
|--------------------------------------------------------------------------
| Find Existing Payment
|--------------------------------------------------------------------------
*/

const getExistingPayment = async (
    societyId,
    idempotencyKey
) => {

    return await PaymentRepository
        .findByIdempotencyKey(
            societyId,
            idempotencyKey
        );
};


/*
|--------------------------------------------------------------------------
| Initiate Online Payment
|--------------------------------------------------------------------------
*/

const initiateOnlinePayment = async (
    data
) => {

    validateSociety(
        data.societyId
    );

    validateAmount(
        data.amount
    );

    validateIdempotencyKey(
        data.idempotencyKey
    );

    const existing =
        await getExistingPayment(
            data.societyId,
            data.idempotencyKey
        );

    if (existing) {

        return {
            duplicate: true,
            payment: existing
        };
    }

    const paymentReference =
        generatePaymentReference();

    const payment =
        await PaymentRepository.create({
            societyId: data.societyId,

            invoiceId:
                data.invoiceId || null,

            unitId:
                data.unitId || null,

            memberId:
                data.memberId || null,

            ledgerAccountId:
                data.ledgerAccountId || null,

            paymentReference,

            paymentMethod: "ONLINE",

            paymentChannel: "GATEWAY",

            amount: data.amount,

            paymentDate:
                data.paymentDate ||
                new Date(),

            status: "INITIATED",

            gatewayName:
                data.gatewayName ||
                null,

            // Set only after a configured provider adapter creates a real order.
            gatewayOrderId: null,

            idempotencyKey:
                data.idempotencyKey,

            metadata:
                data.metadata || null,

            remarks:
                data.remarks || null
        });

    return {
        duplicate: false,

        payment
    };
};


/*
|--------------------------------------------------------------------------
| Create Offline Payment
|--------------------------------------------------------------------------
*/

const createOfflinePayment = async (
    data
) => {

    validateSociety(
        data.societyId
    );

    validateAmount(
        data.amount
    );

    validateIdempotencyKey(
        data.idempotencyKey
    );

    validatePaymentMethod(
        data.paymentMethod
    );

    if (
        data.paymentMethod === "ONLINE"
    ) {
        throw new Error(
            "Use online payment initiation for ONLINE payments"
        );
    }

    const existing =
        await getExistingPayment(
            data.societyId,
            data.idempotencyKey
        );

    if (existing) {

        return {
            duplicate: true,
            payment: existing
        };
    }

    const paymentReference =
        data.paymentReference ||
        generatePaymentReference();

    const payment =
        await PaymentRepository.create({

            societyId:
                data.societyId,

            invoiceId:
                data.invoiceId || null,

            unitId:
                data.unitId || null,

            memberId:
                data.memberId || null,

            ledgerAccountId:
                data.ledgerAccountId || null,

            paymentReference,

            paymentMethod:
                data.paymentMethod,

            paymentChannel: "OFFLINE",

            amount:
                data.amount,

            paymentDate:
                data.paymentDate ||
                new Date(),

            status:
                "VERIFICATION_PENDING",

            idempotencyKey:
                data.idempotencyKey,

            metadata:
                data.metadata || null,

            remarks:
                data.remarks || null
        });

    return {
        duplicate: false,
        payment
    };
};


/*
|--------------------------------------------------------------------------
| Find Invoice
|--------------------------------------------------------------------------
*/

const getInvoice = async (
    invoiceId,
    transaction,
    lock = false
) => {

    if (!invoiceId) {
        throw new Error(
            "invoiceId is required for financial posting"
        );
    }

    const invoice =
        await Invoice.findByPk(
            invoiceId,
            transaction
                ? {
                    transaction,
                    ...(lock ? { lock: transaction.LOCK.UPDATE } : {})
                }
                : {}
        );

    if (!invoice) {
        throw new Error(
            "Invoice not found"
        );
    }

    return invoice;
};


/*
|--------------------------------------------------------------------------
| Update Invoice
|--------------------------------------------------------------------------
*/

const updateInvoicePayment = async (
    invoice,
    paymentAmount,
    transaction
) => {

    const currentPaidCents = toCents(invoice.paidAmount);
    const totalCents = toCents(invoice.totalAmount);
    const paymentCents = toCents(paymentAmount);
    const newPaid = (currentPaidCents + paymentCents) / 100;
    const newOutstanding = Math.max(totalCents - currentPaidCents - paymentCents, 0) / 100;

    let status;

    if (newOutstanding <= 0) {

        status = "PAID";

    } else if (newPaid > 0) {

        status = "PARTIALLY_PAID";

    } else {

        status = invoice.status;
    }

    await invoice.update(
        {
            paidAmount: newPaid,

            outstandingAmount:
                newOutstanding,

            status
        },
        {
            transaction
        }
    );

    return invoice;
};


/*
|--------------------------------------------------------------------------
| Find Open Accounting Period
|--------------------------------------------------------------------------
*/

const getOpenAccountingPeriod = async (
    societyId,
    paymentDate,
    transaction
) => {

    const date =
        paymentDate ||
        new Date();

    const period =
        await AccountingPeriod.findOne({
            where: {
                societyId,

                status: "OPEN",

                startDate: {
                    [require("sequelize").Op.lte]:
                        date
                },

                endDate: {
                    [require("sequelize").Op.gte]:
                        date
                }
            },

            transaction
        });

    if (!period) {

        throw new Error(
            "No OPEN accounting period found for payment date"
        );
    }

    return period;
};


/*
|--------------------------------------------------------------------------
| Find Receivable Account
|--------------------------------------------------------------------------
*/

const getReceivableAccount = async (
    payment,
    transaction
) => {

    if (payment.ledgerAccountId) {

        const ledger =
            await LedgerAccount.findByPk(
                payment.ledgerAccountId,
                {
                    transaction
                }
            );

        if (ledger) {

            const account =
                await Account.findOne({
                    where: {
                        id: ledger.accountId,
                        societyId:
                            payment.societyId,
                        isActive: true
                    },
                    transaction
                });

            if (account) {
                return account;
            }
        }
    }

    const account =
        await Account.findOne({
            where: {
                societyId:
                    payment.societyId,

                accountCode: "1300",

                isActive: true
            },

            transaction
        });

    if (!account) {

        throw new Error(
            "Receivable account 1300 not found"
        );
    }

    return account;
};


/*
|--------------------------------------------------------------------------
| Find Bank / Cash Account
|--------------------------------------------------------------------------
*/

const getPaymentAccount = async (
    payment,
    transaction
) => {

    const accountCode =
        payment.paymentMethod === "CASH"
            ? "1100"
            : "1200";

    const account =
        await Account.findOne({
            where: {
                societyId:
                    payment.societyId,

                accountCode,

                isActive: true
            },

            transaction
        });

    if (!account) {

        throw new Error(
            `Payment account ${accountCode} not found`
        );
    }

    return account;
};


/*
|--------------------------------------------------------------------------
| Create Payment Journal
|--------------------------------------------------------------------------
*/

const createPaymentJournal = async (
    payment,
    transaction
) => {

    if (payment.journalId) {

        return await Journal.findByPk(
            payment.journalId,
            { transaction }
        );
    }

    const accountingPeriod =
        await getOpenAccountingPeriod(
            payment.societyId,
            payment.paymentDate,
            transaction
        );

    const bankAccount =
        await getPaymentAccount(
            payment,
            transaction
        );

    const receivableAccount =
        await getReceivableAccount(
            payment,
            transaction
        );

    const journalNumber =
        `PAY-${Date.now()}-${Math.floor(
            Math.random() * 10000
        )}`;

    const journal =
        await Journal.create(
            {
                societyId:
                    payment.societyId,

                accountingPeriodId:
                    accountingPeriod.id,

                journalNumber,

                transactionDate:
                    payment.paymentDate,

                referenceType:
                    "PAYMENT",

                referenceId:
                    payment.id,

                description:
                    `Payment received - ${payment.paymentReference}`,

                status:
                    "DRAFT",

                totalDebit:
                    payment.amount,

                totalCredit:
                    payment.amount
            },
            {
                transaction
            }
        );

    await JournalLine.create(
        {
            journalId:
                journal.id,

            accountId:
                bankAccount.id,

            lineNumber: 1,

            description:
                `Payment received through ${payment.paymentMethod}`,

            debitAmount:
                payment.amount,

            creditAmount: 0
        },
        {
            transaction
        }
    );

    await JournalLine.create(
        {
            journalId:
                journal.id,

            accountId:
                receivableAccount.id,

            lineNumber: 2,

            description:
                `Receivable cleared - ${payment.paymentReference}`,

            debitAmount: 0,

            creditAmount:
                payment.amount
        },
        {
            transaction
        }
    );

    return journal;
};


/*
|--------------------------------------------------------------------------
| Mark Payment Financially Successful
|--------------------------------------------------------------------------
*/

const completePayment = async (
    paymentId,
    options = {}
) => {

    const transaction =
        await sequelize.transaction();

    try {

        const payment =
            await PaymentRepository.findById(
                paymentId,
                transaction,
                true
            );

        if (!payment) {
            throw new Error(
                "Payment not found"
            );
        }

        /*
        Already posted
        */

        if (
            payment.journalId &&
            (
                payment.status === "SUCCESS" ||
                payment.status === "VERIFIED"
            )
        ) {

            await transaction.commit();

            return {
                duplicate: true,
                payment
            };
        }

        if (!['INITIATED', 'PENDING', 'VERIFICATION_PENDING'].includes(payment.status)) {
            throw new Error(`Payment cannot be completed from status ${payment.status}`);
        }

        // Serialize invoice payment posting with statement generation for the
        // same Society + Unit before either path reads outstanding amounts.
        const invoiceScope = await Invoice.findByPk(payment.invoiceId, { transaction });
        if (!invoiceScope) throw new Error("Invoice not found");
        if (invoiceScope.societyId !== payment.societyId || (payment.unitId && invoiceScope.unitId !== payment.unitId)) {
            throw new Error("Payment and Invoice Society or Unit references do not match");
        }
        await InvoiceRepository.lockUnitFinancialScope(
            invoiceScope.societyId,
            invoiceScope.unitId,
            transaction
        );

        /*
        Invoice
        */

        const invoice =
            await getInvoice(
                payment.invoiceId,
                transaction,
                true
            );

        if (
            invoice.societyId !== payment.societyId ||
            invoice.id !== payment.invoiceId ||
            (payment.unitId && invoice.unitId !== payment.unitId)
        ) {
            throw new Error("Payment and Invoice Society or Unit references do not match");
        }

        /*
        Prevent overpayment
        */

        const outstandingCents = toCents(invoice.outstandingAmount);
        if (toCents(invoice.totalAmount) !== toCents(invoice.paidAmount) + outstandingCents) {
            throw new Error("Invoice paid and outstanding amounts do not reconcile to its total");
        }

        if (outstandingCents <= 0 || !['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
            throw new Error("Invoice has no payable outstanding balance");
        }

        const paymentAmountCents = toCents(payment.amount);
        if (paymentAmountCents <= 0 || paymentAmountCents > outstandingCents) {

            throw new Error(
                `Payment amount ${payment.amount} exceeds invoice outstanding amount ${invoice.outstandingAmount}`
            );
        }

        /*
        Create journal
        */

        const journal =
            await createPaymentJournal(
                payment,
                transaction
            );

        /*
        Post journal
        */

        journal.status = "POSTED";
        journal.postedAt = new Date();

        await journal.save({
            transaction
        });

        /*
        Update invoice
        */

        await updateInvoicePayment(
            invoice,
            payment.amount,
            transaction
        );

        if (invoice.billingId) {
            const billing = await Billing.findByPk(invoice.billingId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!billing) {
                throw new Error("Invoice references a missing Billing record");
            }
            if (
                billing.societyId !== invoice.societyId ||
                billing.unitId !== invoice.unitId ||
                toCents(billing.totalAmount) !== toCents(invoice.totalAmount)
            ) {
                throw new Error("Invoice and Billing references or totals do not match");
            }
            await billing.update({
                paidAmount: invoice.paidAmount,
                outstandingAmount: invoice.outstandingAmount,
                status: invoice.status,
            }, { transaction });
        }

        /*
        Receipt
        */

        const receiptNumber =
            payment.receiptNumber ||
            generateReceiptNumber();

        /*
        Update payment
        */

        await PaymentRepository.update(
            payment,
            {
                status:
                    options.status ||
                    "SUCCESS",

                receiptNumber,

                journalId:
                    journal.id,

                gatewayTransactionId:
                    options.gatewayTransactionId ||
                    payment.gatewayTransactionId,

                gatewaySignature:
                    options.gatewaySignature ||
                    payment.gatewaySignature,

                verifiedAt:
                    new Date(),

                verificationRemarks:
                    options.verificationRemarks ||
                    null,
                verifiedBy: options.verifiedBy || null
            },
            transaction
        );

        await transaction.commit();

        return {
            duplicate: false,

            payment
        };

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Verify Offline Payment
|--------------------------------------------------------------------------
*/

const verifyOfflinePayment = async (
    paymentId,
    data,
    verifiedBy
) => {

    const payment =
        await PaymentRepository.findById(
            paymentId
        );

    if (!payment) {

        throw new Error(
            "Payment not found"
        );
    }

    if (
        payment.status !==
        "VERIFICATION_PENDING"
    ) {

        throw new Error(
            `Payment cannot be verified from status ${payment.status}`
        );
    }

    return await completePayment(
        paymentId,
        {
            status: "VERIFIED",

            verificationRemarks:
                data.verificationRemarks ||
                "Offline payment verified",
            verifiedBy
        }
    );
};


/*
|--------------------------------------------------------------------------
| Online Webhook
|--------------------------------------------------------------------------
*/

const processWebhook = async (
    data
) => {

    if (!data.paymentId) {

        throw new Error(
            "paymentId is required"
        );
    }

    if (!data.signature) {

        throw new Error(
            "Webhook signature is required"
        );
    }

    if (!data.gatewayOrderId) {
        throw new Error("Gateway order ID is required");
    }

    if (!["SUCCESS", "FAILED", "CANCELLED"].includes(data.status)) {
        throw new Error("Unsupported payment provider status");
    }

    if (data.status === "SUCCESS" && !data.gatewayTransactionId) {
        throw new Error("Gateway transaction ID is required for successful payments");
    }

    const payload = {
        paymentId:
            data.paymentId,

        gatewayOrderId:
            data.gatewayOrderId,

        gatewayTransactionId:
            data.gatewayTransactionId,

        amount:
            data.amount,

        status:
            data.status
    };

    const valid =
        verifyWebhookSignature(
            payload,
            data.signature
        );

    if (!valid) {

        throw new Error(
            "Invalid webhook signature"
        );
    }

    const payment =
        await PaymentRepository.findById(
            data.paymentId
        );

    if (!payment) {

        throw new Error(
            "Payment not found"
        );
    }

    if (!payment.invoiceId || !payment.societyId || payment.paymentChannel !== "GATEWAY") {
        throw new Error("Webhook does not reference a valid online payment");
    }

    if (payment.gatewayOrderId !== data.gatewayOrderId) {
        throw new Error("Gateway order ID does not match");
    }

    const webhookAmount = Number(data.amount);
    const paymentAmount = Number(payment.amount);
    if (!Number.isFinite(webhookAmount) || webhookAmount <= 0 || webhookAmount !== paymentAmount) {
        throw new Error("Webhook amount does not match payment amount");
    }

    /*
    Idempotent webhook
    */

    if (
        payment.journalId &&
        (
            payment.status === "SUCCESS" ||
            payment.status === "VERIFIED"
        )
    ) {

        if (payment.gatewayTransactionId !== data.gatewayTransactionId) {
            throw new Error("Gateway transaction ID does not match the completed payment");
        }

        return {
            duplicate: true,
            payment
        };
    }

    if (
        data.status !== "SUCCESS"
    ) {
        const transaction = await sequelize.transaction();
        try {
            const lockedPayment = await PaymentRepository.findById(
                data.paymentId,
                transaction,
                true
            );
            if (!lockedPayment) {
                throw new Error("Payment not found");
            }

            if (
                lockedPayment.journalId &&
                ["SUCCESS", "VERIFIED"].includes(lockedPayment.status)
            ) {
                if (lockedPayment.gatewayTransactionId !== data.gatewayTransactionId) {
                    throw new Error("Gateway transaction ID does not match the completed payment");
                }
                await transaction.commit();
                return { duplicate: true, payment: lockedPayment };
            }

            const nextStatus = data.status === "FAILED" ? "FAILED" : "CANCELLED";
            if (["FAILED", "CANCELLED"].includes(lockedPayment.status)) {
                if (
                    lockedPayment.status === nextStatus &&
                    lockedPayment.gatewayOrderId === data.gatewayOrderId
                ) {
                    await transaction.commit();
                    return { duplicate: true, payment: lockedPayment };
                }
                throw new Error(`Payment cannot be changed from status ${lockedPayment.status}`);
            }

            if (!["INITIATED", "PENDING"].includes(lockedPayment.status)) {
                throw new Error(`Payment cannot be changed from status ${lockedPayment.status}`);
            }

            await PaymentRepository.update(
                lockedPayment,
                {
                    status: nextStatus,
                    gatewayTransactionId: data.gatewayTransactionId,
                    gatewaySignature: data.signature,
                },
                transaction
            );
            await transaction.commit();
            return { duplicate: false, payment: lockedPayment };
        } catch (error) {
            if (!transaction.finished) await transaction.rollback();
            throw error;
        }
    }

    return await completePayment(
        payment.id,
        {
            status: "SUCCESS",

            gatewayTransactionId:
                data.gatewayTransactionId,

            gatewaySignature:
                data.signature
        }
    );
};

const processRazorpayWebhook = async (rawBody, signature) => {
    if (!Razorpay.verifyWebhookSignature(rawBody, signature)) throw new Error('Invalid Razorpay webhook signature');
    let event;
    try { event = JSON.parse(rawBody.toString('utf8')); } catch { throw new Error('Invalid Razorpay webhook body'); }
    const eventName = event.event;
    let gatewayPayment = event.payload?.payment?.entity;
    if (eventName === 'order.paid' && !gatewayPayment) {
        const orderId = event.payload?.order?.entity?.id;
        const response = orderId ? await Razorpay.fetchOrderPayments(orderId) : null;
        gatewayPayment = response?.items?.find((item) => item.status === 'captured');
    }
    if (!['payment.captured', 'payment.failed', 'order.paid'].includes(eventName) || !gatewayPayment) {
        return { ignored: true };
    }
    const payment = await PaymentRepository.findByGatewayOrderId(gatewayPayment.order_id);
    if (!payment || payment.paymentChannel !== 'GATEWAY') throw new Error('Payment order not found');
    if (eventName === 'payment.failed') {
        const currentGatewayPayment = await Razorpay.fetchPayment(gatewayPayment.id);
        if (currentGatewayPayment.status === 'captured') {
            const currentOrder = await Razorpay.fetchOrder(currentGatewayPayment.order_id);
            if (currentOrder.status === 'paid' && Number(currentGatewayPayment.amount) === toCents(payment.amount)) {
                return completePayment(payment.id, {
                    status: 'SUCCESS', gatewayTransactionId: currentGatewayPayment.id,
                    verificationRemarks: 'Razorpay captured payment confirmed after failure webhook',
                });
            }
        }
        const tx = await sequelize.transaction();
        try {
            const locked = await PaymentRepository.findById(payment.id, tx, true);
            if (['SUCCESS', 'VERIFIED'].includes(locked.status) && locked.journalId) {
                await tx.commit();
                return { duplicate: true, payment: locked };
            }
            if (!['INITIATED', 'PENDING'].includes(locked.status)) {
                await tx.commit();
                return { duplicate: true, payment: locked };
            }
            await PaymentRepository.update(locked, { status: 'FAILED', gatewayTransactionId: gatewayPayment.id }, tx);
            await tx.commit();
            return { duplicate: false, payment: locked };
        } catch (error) {
            if (!tx.finished) await tx.rollback();
            throw error;
        }
    }
    const [confirmedPayment, order] = await Promise.all([
        Razorpay.fetchPayment(gatewayPayment.id), Razorpay.fetchOrder(gatewayPayment.order_id),
    ]);
    if (confirmedPayment.status !== 'captured' || order.status !== 'paid' || Number(confirmedPayment.amount) !== toCents(payment.amount)) {
        throw new Error('Razorpay has not confirmed a captured payment for this order');
    }
    return completePayment(payment.id, {
        status: 'SUCCESS', gatewayTransactionId: confirmedPayment.id,
        verificationRemarks: 'Razorpay captured payment confirmed by webhook',
    });
};


/*
|--------------------------------------------------------------------------
| Get Payment
|--------------------------------------------------------------------------
*/

const getById = async (id) => {

    const payment =
        await PaymentRepository.findById(
            id
        );

    if (!payment) {

        throw new Error(
            "Payment not found"
        );
    }

    return payment;
};


/*
|--------------------------------------------------------------------------
| Get Payments
|--------------------------------------------------------------------------
*/

const getAll = async (filters) => {

    return await PaymentRepository.findAll(
        filters
    );
};


/*
|--------------------------------------------------------------------------
| Cancel Payment
|--------------------------------------------------------------------------
*/

const cancelPayment = async (
    paymentId,
    remarks
) => {

    const cancellationReason =
        typeof remarks === "string"
            ? remarks.trim()
            : "";

    if (!cancellationReason) {
        throw new Error("Cancellation reason is required");
    }

    const payment =
        await PaymentRepository.findById(
            paymentId
        );

    if (!payment) {

        throw new Error(
            "Payment not found"
        );
    }

    if (payment.journalId) {

        throw new Error(
            "Posted payment cannot be cancelled directly. Use refund/reversal workflow."
        );
    }

    await PaymentRepository.update(
        payment,
        {
            status: "CANCELLED",
            remarks: cancellationReason
        }
    );

    return payment;
};


module.exports = {
    initiateOnlinePayment,
    createOfflinePayment,
    verifyOfflinePayment,
    processWebhook,
    processRazorpayWebhook,
    completePayment,
    getById,
    getAll,
    cancelPayment
};
