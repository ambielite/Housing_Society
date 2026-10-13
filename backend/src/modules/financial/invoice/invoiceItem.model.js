const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const InvoiceItem = sequelize.define(
    "InvoiceItem",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        invoiceId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "invoice_id"
        },

        billingConfigId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "billing_config_id"
        },

        description: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        quantity: {
            type: DataTypes.DECIMAL(15, 4),
            allowNull: false,
            defaultValue: 1
        },

        rate: {
            type: DataTypes.DECIMAL(15, 4),
            allowNull: false,
            defaultValue: 0
        },

        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0
        },

        taxRate: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
            field: "tax_rate"
        },

        taxAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "tax_amount"
        },

        totalAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "total_amount"
        }
    },
    {
        tableName: "invoice_items",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: [
                    "invoice_id"
                ]
            },

            {
                fields: [
                    "billing_config_id"
                ]
            }
        ]
    }
);

module.exports = InvoiceItem;