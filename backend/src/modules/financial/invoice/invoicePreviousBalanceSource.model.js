const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

module.exports = sequelize.define("InvoicePreviousBalanceSource", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    statementInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "statement_invoice_id",
    },
    sourceInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "source_invoice_id",
    },
    amountAtStatement: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: "amount_at_statement",
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
    },
}, {
    tableName: "invoice_previous_balance_sources",
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ["statement_invoice_id", "source_invoice_id"],
        },
        { fields: ["source_invoice_id"] },
    ],
});
