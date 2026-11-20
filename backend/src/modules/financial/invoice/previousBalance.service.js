const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../../../config/database");
const Invoice = require("./invoice.model");
const InvoicePreviousBalanceSource = require("./invoicePreviousBalanceSource.model");

const hasSourceTable = async (transaction = null) => {
    const rows = await sequelize.query(
        `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'invoice_previous_balance_sources'
        ) AS table_exists`,
        { type: QueryTypes.SELECT, ...(transaction ? { transaction } : {}) }
    );
    return rows[0]?.table_exists === true;
};

const getLivePreviousBalances = async (statementInvoices) => {
    const invoices = Array.isArray(statementInvoices) ? statementInvoices : [];
    if (!invoices.length) return new Map();
    if (!(await hasSourceTable())) return new Map();

    const statementIds = invoices.map((invoice) => invoice.id);
    const references = await InvoicePreviousBalanceSource.findAll({
        where: { statementInvoiceId: { [Op.in]: statementIds } },
    });
    const sourceIds = [...new Set(references.map((source) => source.sourceInvoiceId))];
    if (!sourceIds.length) return new Map(invoices.map((invoice) => [invoice.id, { amount: 0, sources: [] }]));

    const sources = await Invoice.findAll({
        where: {
            id: { [Op.in]: sourceIds },
            status: { [Op.in]: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
            outstandingAmount: { [Op.gt]: 0 },
        },
        attributes: ["id", "societyId", "unitId", "billingPeriod", "invoiceNumber", "status", "outstandingAmount"],
    });
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const refsByStatement = new Map();
    for (const reference of references) {
        const source = sourceById.get(reference.sourceInvoiceId);
        const statement = invoices.find((invoice) => invoice.id === reference.statementInvoiceId);
        if (!source || !statement || source.societyId !== statement.societyId || source.unitId !== statement.unitId) continue;
        if (source.billingPeriod === statement.billingPeriod) continue;
        const rows = refsByStatement.get(statement.id) || [];
        rows.push({
            invoiceId: source.id,
            invoiceNumber: source.invoiceNumber,
            billingPeriod: source.billingPeriod,
            status: source.status,
            amountAtStatement: Number(reference.amountAtStatement),
            outstandingAmount: Number(source.outstandingAmount),
        });
        refsByStatement.set(statement.id, rows);
    }

    return new Map(invoices.map((invoice) => {
        const rows = refsByStatement.get(invoice.id) || [];
        return [invoice.id, {
            amount: Number(rows.reduce((sum, row) => sum + Math.round(row.outstandingAmount * 100), 0) / 100),
            sources: rows,
        }];
    }));
};

module.exports = { hasSourceTable, getLivePreviousBalances };
