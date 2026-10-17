const sequelize =
    require("../../../config/database");

const repository =
    require("./invoice.repository");

const Billing =
    require("../billing/billing.model");

const calculatePreviousBalance = async (
    societyId,
    unitId,
    invoiceDate
) => {

    const invoices =
        await repository.findOutstandingByUnit(
            societyId,
            unitId,
            invoiceDate
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
    data
) => {

    /*
     * STEP 1
     * Check idempotency key first.
     */

    const existingByKey =
        await repository.findByIdempotencyKey(
            data.societyId,
            data.idempotencyKey
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
            data.invoiceNumber
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
                data.billingId
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

    const previousBalance = data.includePreviousBalance === false
        ? 0
        : await calculatePreviousBalance(
            data.societyId,
            data.unitId,
            data.invoiceDate
        );

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

    let subtotal = 0;
    let taxAmount = 0;

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

        if (quantity <= 0) {
            throw new Error(
                "Item quantity must be greater than 0"
            );
        }

        if (rate < 0) {
            throw new Error(
                "Item rate cannot be negative"
            );
        }

        if (taxRate < 0) {
            throw new Error(
                "Item tax rate cannot be negative"
            );
        }

        const amount =
            Number(
                (
                    quantity *
                    rate
                ).toFixed(2)
            );

        const itemTax =
            Number(
                (
                    amount *
                    taxRate /
                    100
                ).toFixed(2)
            );

        const itemTotal =
            Number(
                (
                    amount +
                    itemTax
                ).toFixed(2)
            );

        subtotal += amount;
        taxAmount += itemTax;

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

    subtotal =
        Number(
            subtotal.toFixed(2)
        );

    taxAmount =
        Number(
            taxAmount.toFixed(2)
        );

    const penaltyAmount =
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

    const totalAmount =
        Number(
            (
                previousBalance +
                subtotal +
                taxAmount +
                penaltyAmount
            ).toFixed(2)
        );

    /*
     * STEP 7
     * Create invoice + items
     * inside one transaction.
     */

    const transaction =
        await sequelize.transaction();

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
                transaction
            );

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
                transaction
            );
        }

        await transaction.commit();

        const createdInvoice =
            await repository.findById(
                invoice.id
            );

        return {
            invoice:
                createdInvoice,
            duplicate: false
        };

    } catch (error) {

        if (
            transaction &&
            !transaction.finished
        ) {
            await transaction.rollback();
        }

        /*
         * Database unique constraint
         * can happen when two requests
         * use the same idempotency key
         * concurrently.
         */

        if (
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

    return repository.findAll(
        where
    );
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

    return invoice;
};

const issueInvoice = async (
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
        invoice.status !==
        "DRAFT"
    ) {
        throw new Error(
            "Only DRAFT invoice can be issued"
        );
    }

    await invoice.update({
        status: "ISSUED"
    });

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
