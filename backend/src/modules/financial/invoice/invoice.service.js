const sequelize =
    require("../../../config/database");

const repository =
    require("./invoice.repository");

const Billing =
    require("../billing/billing.model");
const Unit = require("../../societies/unit/unit.model");
const PreviousBalanceService = require("./previousBalance.service");

const toCents = (amount) => Math.round(Number(amount || 0) * 100);
const fromCents = (amount) => Number((amount / 100).toFixed(2));

const calculatePreviousBalance = async (
    societyId,
    unitId,
    invoiceDate,
    transaction = null,
    billingPeriod = null
) => {

    const invoices =
        await repository.findOutstandingByUnit(
            societyId,
            unitId,
            invoiceDate,
            transaction,
            billingPeriod
        );

    let previousBalance = 0;

    for (const invoice of invoices) {

        previousBalance +=
            Number(
                invoice.outstandingAmount || 0
            );
    }

    return Number(
        previousBalance.toFixed(2)
    );
};

const createInvoice = async (
    data,
    options = {}
) => {
    const transaction = options.transaction || null;
    const ownsTransaction = !transaction;

    const unit = await Unit.findByPk(data.unitId, transaction ? { transaction } : undefined);
    if (!unit || unit.status === "VACANT") {
        throw new Error("Bills cannot be generated or assigned to vacant units.");
    }

    /*
     * STEP 1
     * Check idempotency key first.
     */

    const existingByKey =
        await repository.findByIdempotencyKey(
            data.societyId,
            data.idempotencyKey,
            transaction
        );

    if (existingByKey) {

        return {
            invoice: existingByKey,
            duplicate: true
        };
    }

    /*
     * STEP 2
     * Check invoice number.
     */

    const existingByNumber =
        await repository.findByInvoiceNumber(
            data.societyId,
            data.invoiceNumber,
            transaction
        );

    if (existingByNumber) {
        throw new Error(
            "Invoice number already exists"
        );
    }

    /*
     * STEP 3
     * Validate dates.
     */

    const invoiceDate =
        new Date(data.invoiceDate);

    const dueDate =
        new Date(data.dueDate);

    if (invoiceDate > dueDate) {
        throw new Error(
            "invoiceDate cannot be greater than dueDate"
        );
    }

    /*
     * STEP 4
     * Prevent multiple invoices
     * for the same billing record.
     */

    if (data.billingId) {

        const existingBillingInvoice =
            await repository.findByBillingId(
                data.billingId,
                transaction
            );

        if (existingBillingInvoice) {

            return {
                invoice:
                    existingBillingInvoice,
                duplicate: true
            };
        }
    }

    /*
     * STEP 5
     * Calculate previous balance.
     */

    let previousBalance = data.previousBalance !== undefined
        ? Number(data.previousBalance)
        : data.includePreviousBalance !== true
            ? 0
            : await calculatePreviousBalance(
                data.societyId,
                data.unitId,
                data.invoiceDate,
                transaction,
                data.billingPeriod
            );

    if (!Number.isFinite(previousBalance) || previousBalance < 0) {
        throw new Error("previousBalance must be a non-negative number");
    }

    /*
     * STEP 6
     * Calculate invoice items.
     */

    const items =
        Array.isArray(data.items)
            ? data.items
            : [];

    if (items.length === 0) {
        throw new Error(
            "At least one invoice item is required"
        );
    }

    let subtotalCents = 0;
    let taxAmountCents = 0;

    const preparedItems = [];

    for (
        const item of items
    ) {

        const quantity =
            Number(
                item.quantity || 1
            );

        const rate =
            Number(
                item.rate || 0
            );

        const taxRate =
            Number(
                item.taxRate || 0
            );

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error(
                "Item quantity must be greater than 0"
            );
        }

        if (!Number.isFinite(rate) || rate < 0) {
            throw new Error(
                "Item rate cannot be negative"
            );
        }

        if (!Number.isFinite(taxRate) || taxRate < 0) {
            throw new Error(
                "Item tax rate cannot be negative"
            );
        }

        const amount = fromCents(Math.round(quantity * rate * 100));

        const itemTax = item.taxAmount === undefined
            ? fromCents(Math.round(toCents(amount) * taxRate / 100))
            : fromCents(toCents(item.taxAmount));

        if (!Number.isFinite(itemTax) || itemTax < 0) {
            throw new Error("Item tax amount must be a non-negative number");
        }

        const itemTotal = fromCents(toCents(amount) + toCents(itemTax));

        subtotalCents += toCents(amount);
        taxAmountCents += toCents(itemTax);

        preparedItems.push({
            billingConfigId:
                item.billingConfigId ||
                null,

            description:
                item.description,

            quantity,

            rate,

            amount,

            taxRate,

            taxAmount:
                itemTax,

            totalAmount:
                itemTotal
        });
    }

    let subtotal = fromCents(subtotalCents);
    let taxAmount = fromCents(taxAmountCents);

    let penaltyAmount =
        Number(
            data.penaltyAmount || 0
        );

    if (penaltyAmount < 0) {
        throw new Error(
            "penaltyAmount cannot be negative"
        );
    }

    /*
     * Total invoice amount
     */

    const accountingTotals = data.accountingTotals;
    if (accountingTotals !== undefined) {
        const components = {
            previousBalance: Number(accountingTotals.previousBalance),
            subtotal: Number(accountingTotals.subtotal),
            taxAmount: Number(accountingTotals.taxAmount),
            penaltyAmount: Number(accountingTotals.penaltyAmount),
        };
        if (Object.values(components).some((amount) => !Number.isFinite(amount) || amount < 0)) {
            throw new Error("accountingTotals must contain non-negative monetary amounts");
        }
        const componentTotalCents = toCents(components.subtotal) +
            toCents(components.taxAmount) + toCents(components.penaltyAmount);
        const itemTotalCents = preparedItems
            .reduce((sum, item) => sum + toCents(item.totalAmount), 0);
        const itemTaxCents = preparedItems
            .reduce((sum, item) => sum + toCents(item.taxAmount), 0);
        if (
            itemTotalCents !== componentTotalCents ||
            itemTaxCents !== toCents(components.taxAmount)
        ) {
            throw new Error("Invoice item totals do not reconcile to accountingTotals");
        }
        previousBalance = fromCents(toCents(components.previousBalance));
        subtotal = fromCents(toCents(components.subtotal));
        taxAmount = fromCents(toCents(components.taxAmount));
        penaltyAmount = fromCents(toCents(components.penaltyAmount));
    }

    const totalAmount = fromCents(
        toCents(subtotal) +
        toCents(taxAmount) +
        toCents(penaltyAmount)
    );

    /*
     * STEP 7
     * Create invoice + items
     * inside one transaction.
     */

    const writeTransaction = transaction || await sequelize.transaction();

    try {

        const invoice =
            await repository.createInvoice(
                {
                    societyId:
                        data.societyId,

                    unitId:
                        data.unitId,

                    memberId:
                        data.memberId ||
                        null,

                    billingId:
                        data.billingId ||
                        null,

                    invoiceNumber:
                        data.invoiceNumber,

                    billingPeriod:
                        data.billingPeriod,

                    invoiceDate:
                        data.invoiceDate,

                    dueDate:
                        data.dueDate,

                    previousBalance,

                    subtotal,

                    taxAmount,

                    penaltyAmount,

                    totalAmount,

                    paidAmount: 0,

                    outstandingAmount:
                        totalAmount,

                    status:
                        "DRAFT",

                    idempotencyKey:
                        data.idempotencyKey,

                    description:
                        data.description ||
                        null,

                    remarks:
                        data.remarks ||
                        null
                },
                writeTransaction
            );

        if (toCents(previousBalance) > 0 && !data.previousBalanceSources?.length) {
            throw new Error("Positive display-only Previous Balance requires auditable source invoices");
        }
        if (data.previousBalanceSources?.length) {
            const sourceTotal = fromCents(data.previousBalanceSources
                .reduce((sum, source) => sum + toCents(source.outstandingAmount), 0));
            if (toCents(sourceTotal) !== toCents(previousBalance)) {
                throw new Error("Previous balance source invoices do not reconcile to the displayed balance");
            }
            if (!(await PreviousBalanceService.hasSourceTable(writeTransaction))) {
                throw new Error("Previous Balance source schema is not ready; apply migration 0111 before issuing this statement Invoice.");
            }
            await repository.createPreviousBalanceSources(
                invoice,
                data.previousBalanceSources,
                writeTransaction
            );
        }

        for (
            const item
            of preparedItems
        ) {

            await repository.createItem(
                {
                    invoiceId:
                        invoice.id,

                    ...item
                },
                writeTransaction
            );
        }

        if (ownsTransaction) {
            await writeTransaction.commit();
        }

        const createdInvoice = await repository.findById(
            invoice.id,
            ownsTransaction ? null : writeTransaction
        );

        return {
            invoice:
                createdInvoice,
            duplicate: false
        };

    } catch (error) {

        if (
            ownsTransaction &&
            !writeTransaction.finished
        ) {
            await writeTransaction.rollback();
        }

        /*
         * Database unique constraint
         * can happen when two requests
         * use the same idempotency key
         * concurrently.
         */

        if (
            ownsTransaction &&
            error.name ===
            "SequelizeUniqueConstraintError"
        ) {

            const existing =
                await repository.findByIdempotencyKey(
                    data.societyId,
                    data.idempotencyKey
                );

            if (existing) {
                return {
                    invoice: existing,
                    duplicate: true
                };
            }
        }

        throw error;
    }
};

const getAll = async ({
    societyId,
    unitId,
    status
}) => {

    const where = {};

    if (societyId) {
        where.societyId =
            societyId;
    }

    if (unitId) {
        where.unitId =
            unitId;
    }

    if (status) {
        where.status =
            status;
    }

    const invoices = await repository.findAll(where);
    const liveBalances = await PreviousBalanceService.getLivePreviousBalances(invoices);
    return invoices.map((invoice) => {
        const plain = typeof invoice.toJSON === "function" ? invoice.toJSON() : invoice;
        const liveBalance = liveBalances.get(invoice.id) || { amount: 0, sources: [] };
        return {
            ...plain,
            previousBalance: liveBalance.amount,
            previousBalanceSources: liveBalance.sources,
        };
    });
};

const getById = async (
    id
) => {

    const invoice =
        await repository.findById(
            id
        );

    if (!invoice) {
        throw new Error(
            "Invoice not found"
        );
    }

    const liveBalances = await PreviousBalanceService.getLivePreviousBalances([invoice]);
    const plain = typeof invoice.toJSON === "function" ? invoice.toJSON() : invoice;
    const liveBalance = liveBalances.get(invoice.id) || { amount: 0, sources: [] };
    return {
        ...plain,
        previousBalance: liveBalance.amount,
        previousBalanceSources: liveBalance.sources,
    };
};

const issueInvoice = async (
    id,
    transaction = null
) => {

    const invoice =
        await repository.findById(
            id,
            transaction
        );

    if (!invoice) {
        throw new Error(
            "Invoice not found"
        );
    }

    if (
        invoice.status !==
        "DRAFT"
    ) {
        throw new Error(
            "Only DRAFT invoice can be issued"
        );
    }

    await invoice.update({
        status: "ISSUED"
    }, transaction ? { transaction } : undefined);

    return invoice;
};

const cancelInvoice = async (
    id
) => {

    const invoice =
        await repository.findById(
            id
        );

    if (!invoice) {
        throw new Error(
            "Invoice not found"
        );
    }

    if (
        invoice.status ===
        "PAID"
    ) {
        throw new Error(
            "Paid invoice cannot be cancelled"
        );
    }

    if (
        invoice.status ===
        "PARTIALLY_PAID"
    ) {
        throw new Error(
            "Partially paid invoice cannot be cancelled"
        );
    }

    if (
        invoice.status ===
        "CANCELLED"
    ) {
        throw new Error(
            "Invoice is already cancelled"
        );
    }

    await invoice.update({
        status:
            "CANCELLED"
    });

    return invoice;
};

const InvoiceDocumentService =
    require("./invoice.document.service");

const generateInvoiceDocument = async (
    invoiceId
) => {

    const result =
        await InvoiceDocumentService
            .generateInvoiceDocument(
                invoiceId
            );


    const invoice =
        await repository.findById(
            invoiceId
        );


    if (!invoice) {

        throw new Error(
            "Invoice not found"
        );
    }


    await invoice.update({

        documentPath:
            result.relativePath
    });


    return {

        ...result,

        documentPath:
            result.relativePath
    };
};

module.exports = {
    createInvoice,
    getAll,
    getById,
    issueInvoice,
    cancelInvoice,
    generateInvoiceDocument
};
