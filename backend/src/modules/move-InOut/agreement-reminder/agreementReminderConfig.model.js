const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AgreementReminderConfig = sequelize.define(
    "AgreementReminderConfig",
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

        daysBeforeExpiry: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "days_before_expiry"
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

        enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "agreement_reminder_configs",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = AgreementReminderConfig;