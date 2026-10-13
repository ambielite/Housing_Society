const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Invoice = sequelize.define(
    "Invoice",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "society_id"
        },

        unitId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "unit_id"
        },

        memberId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "member_id"
        },

        billingId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "billing_id"
        },

        invoiceNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "invoice_number"
        },

        billingPeriod: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "billing_period"
        },

        invoiceDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "invoice_date"
        },

        dueDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "due_date"
        },

        previousBalance: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "previous_balance"
        },

        subtotal: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0
        },

        taxAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "tax_amount"
        },

        penaltyAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "penalty_amount"
        },

        totalAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "total_amount"
        },

        paidAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "paid_amount"
        },

        outstandingAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "outstanding_amount"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "ISSUED",
                "PARTIALLY_PAID",
                "PAID",
                "OVERDUE",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        idempotencyKey: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "idempotency_key"
        },

        journalId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "journal_id"
        },

        documentPath: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "document_path"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "invoices",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "invoice_number"
                ]
            },

            {
                unique: true,
                fields: [
                    "society_id",
                    "idempotency_key"
                ]
            },

            {
                fields: [
                    "society_id",
                    "unit_id"
                ]
            },

            {
                fields: [
                    "billing_id"
                ]
            },

            {
                fields: [
                    "status"
                ]
            },

            {
                fields: [
                    "due_date"
                ]
            }
        ]
    }
);

module.exports = Invoice;