
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AssetLifecycle = sequelize.define(
    "AssetLifecycle",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "society_id",
            references: {
                model: "societies",
                key: "id"
            }
        },

        assetId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "asset_id",
            references: {
                model: "assets",
                key: "id"
            }
        },

        lifecycleType: {
            type: DataTypes.ENUM(
                "WARRANTY_EXPIRY",
                "AMC_EXPIRY",
                "MAINTENANCE_DUE",
                "LOW_STOCK",
                "RETIREMENT",
                "DISPOSAL"
            ),
            allowNull: false,
            field: "lifecycle_type"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        dueDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "due_date"
        },

        reminderDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "reminder_date"
        },

        reminderDaysBefore: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "reminder_days_before"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "SENT",
                "ACKNOWLEDGED",
                "COMPLETED",
                "CANCELLED",
                "EXPIRED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        priority: {
            type: DataTypes.ENUM(
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ),
            allowNull: false,
            defaultValue: "MEDIUM"
        },

        notificationType: {
            type: DataTypes.ENUM(
                "SYSTEM",
                "EMAIL",
                "SMS",
                "PUSH"
            ),
            allowNull: false,
            defaultValue: "SYSTEM",
            field: "notification_type"
        },

        notificationSentAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "notification_sent_at"
        },

        acknowledgedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "acknowledged_at"
        },

        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "completed_at"
        },

        retirementDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "retirement_date"
        },

        disposalDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "disposal_date"
        },

        disposalMethod: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "disposal_method"
        },

        disposalValue: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "disposal_value",
            validate: {
                min: 0
            }
        },

        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "asset_lifecycle",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: [
                    "society_id"
                ]
            },
            {
                fields: [
                    "asset_id"
                ]
            },
            {
                fields: [
                    "lifecycle_type"
                ]
            },
            {
                fields: [
                    "due_date"
                ]
            },
            {
                fields: [
                    "reminder_date"
                ]
            },
            {
                fields: [
                    "status"
                ]
            },
            {
                fields: [
                    "priority"
                ]
            }
        ]
    }
);

module.exports = AssetLifecycle;

