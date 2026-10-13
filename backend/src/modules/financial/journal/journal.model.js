const { DataTypes } = require("sequelize");

const sequelize =
    require("../../../config/database");

const Journal = sequelize.define(
    "Journal",
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

        accountingPeriodId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "accounting_period_id"
        },

        journalNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "journal_number"
        },

        transactionDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "transaction_date"
        },

        referenceType: {
            type: DataTypes.STRING(100),
            field: "reference_type"
        },

        referenceId: {
            type: DataTypes.UUID,
            field: "reference_id"
        },

        description: {
            type: DataTypes.TEXT
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "POSTED",
                "REVERSED"
            ),
            defaultValue: "DRAFT"
        },

        totalDebit: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: "total_debit"
        },

        totalCredit: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
            field: "total_credit"
        },

        postedAt: {
            type: DataTypes.DATE,
            field: "posted_at"
        },

        postedBy: {
            type: DataTypes.UUID,
            field: "posted_by"
        },

        remarks: {
            type: DataTypes.TEXT
        }
    },
    {
        tableName: "journals",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = Journal;