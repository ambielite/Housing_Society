const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AgreementReminder = sequelize.define(
    "AgreementReminder",
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

        agreementId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "agreement_id"
        },

        reminderType: {
            type: DataTypes.ENUM(
                "FIRST_REMINDER",
                "SECOND_REMINDER",
                "FINAL_REMINDER",
                "EXPIRY_ALERT"
            ),
            allowNull: false,
            field: "reminder_type"
        },

        daysBeforeExpiry: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "days_before_expiry"
        },

        agreementExpiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "agreement_expiry_date"
        },

        reminderDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "reminder_date"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "PROCESSED",
                "SKIPPED",
                "FAILED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        processedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "processed_at"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "agreement_reminders",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = AgreementReminder;