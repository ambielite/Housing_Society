const { DataTypes } = require("sequelize");

const sequelize =
    require("../../../config/database");

const JournalLine = sequelize.define(
    "JournalLine",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        journalId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "journal_id"
        },

        accountId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "account_id"
        },

        lineNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "line_number"
        },

        description: {
            type: DataTypes.TEXT
        },

        debitAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: "debit_amount"
        },

        creditAmount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: "credit_amount"
        }
    },
    {
        tableName: "journal_lines",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = JournalLine;