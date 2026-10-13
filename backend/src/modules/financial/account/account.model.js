const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Account = sequelize.define(
    "Account",
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

        accountCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "account_code"
        },

        accountName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "account_name"
        },

        accountType: {
            type: DataTypes.ENUM(
                "ASSET",
                "LIABILITY",
                "INCOME",
                "EXPENSE",
                "EQUITY",
                "RECEIVABLE"
            ),
            allowNull: false,
            field: "account_type"
        },

        parentAccountId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "parent_account_id"
        },

        isControlAccount: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "is_control_account"
        },

        isSystemAccount: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "is_system_account"
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "is_active"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "accounts",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: ["society_id", "account_code"]
            }
        ]
    }
);

module.exports = Account;