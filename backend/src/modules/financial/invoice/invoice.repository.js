const { Op } = require("sequelize");

const Invoice = require("./invoice.model");
const InvoiceItem = require("./invoiceItem.model");

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
    transaction = null
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
                ? { transaction }
                : {})
        }
    );
};

const findByInvoiceNumber = async (
    societyId,
    invoiceNumber
) => {
    return Invoice.findOne({
        where: {
            societyId,
            invoiceNumber
        }
    });
};

const findByIdempotencyKey = async (
    societyId,
    idempotencyKey
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
        ]
    });
};

const findByBillingId = async (
    billingId
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
        ]
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
    invoiceDate = null
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

    return Invoice.findAll({
        where,
        order: [
            [
                "invoice_date",
                "ASC"
            ]
        ]
    });
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
    update
};