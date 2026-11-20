const { Op } = require("sequelize");

const Invoice = require("./invoice.model");
const InvoiceItem = require("./invoiceItem.model");
const InvoicePreviousBalanceSource = require("./invoicePreviousBalanceSource.model");
const sequelize = require("../../../config/database");

const createInvoice = async (
    data,
    transaction = null
) => {
    return Invoice.create(
        data,
        transaction
            ? { transaction }
            : undefined
    );
};

const createItem = async (
    data,
    transaction = null
) => {
    return InvoiceItem.create(
        data,
        transaction
            ? { transaction }
            : undefined
    );
};

const findById = async (
    id,
    transaction = null,
    lock = false
) => {
    return Invoice.findByPk(
        id,
        {
            include: [
                {
                    model: InvoiceItem,
                    as: "items"
                }
            ],
            ...(transaction
                ? {
                    transaction,
                    ...(lock ? { lock: { level: transaction.LOCK.UPDATE, of: Invoice } } : {})
                }
                : {})
        }
    );
};

const findByInvoiceNumber = async (
    societyId,
    invoiceNumber,
    transaction = null
) => {
    return Invoice.findOne({
        where: {
            societyId,
            invoiceNumber
        },
        ...(transaction ? { transaction } : {})
    });
};

const findByIdempotencyKey = async (
    societyId,
    idempotencyKey,
    transaction = null
) => {
    return Invoice.findOne({
        where: {
            societyId,
            idempotencyKey
        },
        include: [
            {
                model: InvoiceItem,
                as: "items"
            }
        ],
        ...(transaction ? { transaction } : {})
    });
};

const findByBillingId = async (
    billingId,
    transaction = null
) => {
    return Invoice.findOne({
        where: {
            billingId
        },
        include: [
            {
                model: InvoiceItem,
                as: "items"
            }
        ],
        ...(transaction ? { transaction } : {})
    });
};

const findAll = async (
    where = {}
) => {
    return Invoice.findAll({
        where,
        include: [
            {
                model: InvoiceItem,
                as: "items"
            }
        ],
        order: [
            [
                "invoice_date",
                "DESC"
            ],
            [
                "created_at",
                "DESC"
            ]
        ]
    });
};

const findOutstandingByUnit = async (
    societyId,
    unitId,
    invoiceDate = null,
    transaction = null,
    currentBillingPeriod = null
) => {
    const where = {
        societyId,
        unitId,

        outstandingAmount: {
            [Op.gt]: 0
        },

        status: {
            [Op.in]: [
                "ISSUED",
                "PARTIALLY_PAID",
                "OVERDUE"
            ]
        }
    };

    if (invoiceDate) {
        where.invoiceDate = {
            [Op.lt]: invoiceDate
        };
    }

    if (currentBillingPeriod) {
        where.billingPeriod = { [Op.ne]: currentBillingPeriod };
    }

    return Invoice.findAll({
        where,
        order: [
            [
                "invoice_date",
                "ASC"
            ]
        ],
        ...(transaction ? { transaction } : {})
    });
};

// Transaction-scoped mutex shared by billing generation and payment posting.
// A collision only serializes unrelated units; it cannot weaken isolation.
const lockUnitFinancialScope = async (societyId, unitId, transaction) => {
    if (!transaction) throw new Error("A transaction is required to lock a unit financial scope");
    await sequelize.query(
        "SELECT pg_advisory_xact_lock(hashtext(:scope), hashtext(:unitId))",
        { replacements: { scope: `housing-society-finance:${societyId}`, unitId }, transaction }
    );
};

const createPreviousBalanceSources = async (statementInvoice, sources, transaction) => {
    for (const source of sources || []) {
        if (source.id === statementInvoice.id) throw new Error("An invoice cannot reference itself as a previous balance source");
        if (source.societyId !== statementInvoice.societyId || source.unitId !== statementInvoice.unitId) {
            throw new Error("Previous balance source Invoice must belong to the same Society and Unit");
        }
        if (!["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(source.status) || Number(source.outstandingAmount) <= 0) {
            throw new Error(`Previous balance source Invoice ${source.invoiceNumber} is no longer eligible`);
        }
        await InvoicePreviousBalanceSource.create({
            statementInvoiceId: statementInvoice.id,
            sourceInvoiceId: source.id,
            amountAtStatement: Number(source.outstandingAmount),
        }, { transaction });
    }
};

const update = async (
    id,
    data,
    transaction = null
) => {
    const invoice =
        await Invoice.findByPk(id);

    if (!invoice) {
        return null;
    }

    await invoice.update(
        data,
        transaction
            ? { transaction }
            : undefined
    );

    return invoice;
};

module.exports = {
    createInvoice,
    createItem,
    findById,
    findByInvoiceNumber,
    findByIdempotencyKey,
    findByBillingId,
    findAll,
    findOutstandingByUnit,
    lockUnitFinancialScope,
    createPreviousBalanceSources,
    update
};
