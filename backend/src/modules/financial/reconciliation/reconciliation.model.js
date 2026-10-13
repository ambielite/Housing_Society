const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Reconciliation = sequelize.define(
    "Reconciliation",
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

        paymentId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "payment_id"
        },

        transactionReference: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "transaction_reference"
        },

        transactionDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "transaction_date"
        },

        valueDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "value_date"
        },

        transactionType: {
            type: DataTypes.ENUM(
                "CREDIT",
                "DEBIT"
            ),
            allowNull: false,
            field: "transaction_type"
        },

        amount: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: false
        },

        bankName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "bank_name"
        },

        bankAccountNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "bank_account_number"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        utrNumber: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "utr_number"
        },

        status: {
            type: DataTypes.ENUM(
                "IMPORTED",
                "MATCHED",
                "RECONCILED",
                "UNMATCHED",
                "IGNORED"
            ),
            allowNull: false,
            defaultValue: "IMPORTED"
        },

        matchType: {
            type: DataTypes.ENUM(
                "AUTO",
                "MANUAL"
            ),
            allowNull: true,
            field: "match_type"
        },

        matchedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "matched_at"
        },

        matchedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "matched_by"
        },

        reconciledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "reconciled_at"
        },

        reconciledBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "reconciled_by"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "created_at"
        },

        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "updated_at"
        }
    },
    {
        tableName: "reconciliations",
        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "transaction_reference"
                ]
            },

            {
                fields: [
                    "payment_id"
                ]
            },

            {
                fields: [
                    "utr_number"
                ]
            },

            {
                fields: [
                    "status"
                ]
            },

            {
                fields: [
                    "transaction_date"
                ]
            }
        ]
    }
);

module.exports = Reconciliation;