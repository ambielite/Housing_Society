const crypto = require("crypto");

const sequelize =
    require("../../../config/database");

const PaymentRepository =
    require("./payment.repository");

const Invoice =
    require("../invoice/invoice.model");

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
| Generate Gateway Order ID
|--------------------------------------------------------------------------
*/

const generateGatewayOrderId = () => {

    return `ORDER-${Date.now()}-${Math.floor(
        Math.random() * 10000
    )}`;
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

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature || "")
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

    const gatewayOrderId =
        generateGatewayOrderId();

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

            gatewayOrderId,

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
    transaction
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
                ? { transaction }
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

    const currentPaid =
        Number(invoice.paidAmount || 0);

    const total =
        Number(invoice.totalAmount || 0);

    const newPaid =
        currentPaid +
        Number(paymentAmount);

    const newOutstanding =
        Math.max(
            total - newPaid,
            0
        );

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
                paymentId
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

        /*
        Invoice
        */

        const invoice =
            await getInvoice(
                payment.invoiceId,
                transaction
            );

        /*
        Prevent overpayment
        */

        const outstanding =
            Number(
                invoice.outstandingAmount
            );

        if (
            Number(payment.amount) >
            outstanding
        ) {

            throw new Error(
                `Payment amount ${payment.amount} exceeds invoice outstanding amount ${outstanding}`
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
                    null
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
    data
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
                "Offline payment verified"
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

        return {
            duplicate: true,
            payment
        };
    }

    if (
        Number(data.amount) !==
        Number(payment.amount)
    ) {

        throw new Error(
            "Webhook amount does not match payment amount"
        );
    }

    if (
        data.gatewayOrderId &&
        payment.gatewayOrderId !==
            data.gatewayOrderId
    ) {

        throw new Error(
            "Gateway order ID does not match"
        );
    }

    if (
        data.status !== "SUCCESS"
    ) {

        await PaymentRepository.update(
            payment,
            {
                status:
                    data.status === "FAILED"
                        ? "FAILED"
                        : "CANCELLED",

                gatewayTransactionId:
                    data.gatewayTransactionId,

                gatewaySignature:
                    data.signature
            }
        );

        return {
            duplicate: false,
            payment
        };
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
            remarks:
                remarks ||
                "Payment cancelled"
        }
    );

    return payment;
};


module.exports = {
    initiateOnlinePayment,
    createOfflinePayment,
    verifyOfflinePayment,
    processWebhook,
    completePayment,
    getById,
    getAll,
    cancelPayment
};