const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Billing = sequelize.define(
    "Billing",
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

        ledgerAccountId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "ledger_account_id"
        },

        billingConfigId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "billing_config_id"
        },

        billNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "bill_number"
        },

        billingPeriod: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "billing_period"
        },

        billDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "bill_date"
        },

        dueDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "due_date"
        },

        description: {
            type: DataTypes.TEXT
        },

        billingModel: {
            type: DataTypes.ENUM(
                "FLAT_RATE",
                "AREA_BASED",
                "HYBRID"
            ),
            allowNull: true,
            field: "billing_model"
        },

        unitArea: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            field: "unit_area"
        },

        ratePerArea: {
            type: DataTypes.DECIMAL(15, 4),
            allowNull: true,
            field: "rate_per_area"
        },

        fixedAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            field: "fixed_amount"
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

        journalId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "journal_id"
        },

        remarks: {
            type: DataTypes.TEXT
        }
    },
    {
        tableName: "billings",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "bill_number"
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
                    "society_id",
                    "ledger_account_id"
                ]
            },

            {
                fields: [
                    "billing_config_id"
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

module.exports = Billing;