const { DataTypes } = require("sequelize");

const sequelize = require("../../../config/database");

const LedgerAccount = sequelize.define(
    "LedgerAccount",
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
            allowNull: true,
            field: "unit_id"
        },

        memberId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "member_id"
        },

        accountId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "account_id"
        },

        ledgerCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "ledger_code"
        },

        ledgerName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "ledger_name"
        },

        openingBalance: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "opening_balance"
        },

        currentBalance: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
            field: "current_balance"
        },

        balanceType: {
            type: DataTypes.ENUM(
                "DEBIT",
                "CREDIT"
            ),
            allowNull: false,
            defaultValue: "DEBIT",
            field: "balance_type"
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_active"
        },

        description: {
            type: DataTypes.TEXT
        },

        remarks: {
            type: DataTypes.TEXT
        }
    },
    {
        tableName: "ledger_accounts",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "ledger_code"
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
                    "member_id"
                ]
            },

            {
                fields: [
                    "account_id"
                ]
            }
        ]
    }
);

module.exports = LedgerAccount;