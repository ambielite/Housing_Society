
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Notification = sequelize.define(
    "Notification",
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

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        templateId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "template_id",
            references: {
                model: "notification_templates",
                key: "id"
            }
        },

        channel: {
            type: DataTypes.ENUM(
                "IN_APP",
                "EMAIL",
                "SMS",
                "WHATSAPP"
            ),
            allowNull: false
        },

        notificationType: {
            type: DataTypes.ENUM(
                "OPERATIONAL",
                "MARKETING",
                "EMERGENCY"
            ),
            allowNull: false,
            defaultValue: "OPERATIONAL",
            field: "notification_type"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        subject: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        data: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        referenceType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "reference_type"
        },

        referenceId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "reference_id"
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

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "PROCESSING",
                "SENT",
                "DELIVERED",
                "FAILED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_read"
        },

        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "read_at"
        },

        scheduledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "scheduled_at"
        },

        sentAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "sent_at"
        },

        deliveredAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "delivered_at"
        },

        failedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "failed_at"
        },

        retryCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "retry_count"
        },

        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "error_message"
        }
    },
    {
        tableName: "notifications",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["template_id"]
            },
            {
                fields: ["channel"]
            },
            {
                fields: ["notification_type"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["is_read"]
            },
            {
                fields: ["scheduled_at"]
            },
            {
                fields: ["reference_type", "reference_id"]
            }
        ]
    }
);

module.exports = Notification;

