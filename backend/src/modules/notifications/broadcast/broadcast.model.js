
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Broadcast = sequelize.define(
    "Broadcast",
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

        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "created_by"
        },

        updatedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "updated_by"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        subject: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        broadcastType: {
            type: DataTypes.ENUM(
                "NOTICE",
                "ANNOUNCEMENT",
                "ALERT",
                "EMERGENCY"
            ),
            allowNull: false,
            defaultValue: "NOTICE",
            field: "broadcast_type"
        },

        audienceType: {
            type: DataTypes.ENUM(
                "SOCIETY",
                "TOWER",
                "USERS"
            ),
            allowNull: false,
            defaultValue: "SOCIETY",
            field: "audience_type"
        },

        audienceIds: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: "audience_ids"
        },

        channels: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: ["IN_APP"]
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
                "DRAFT",
                "SCHEDULED",
                "SENDING",
                "SENT",
                "CANCELLED",
                "FAILED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        scheduledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "scheduled_at"
        },

        startAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "start_at"
        },

        endAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "end_at"
        },

        sentAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "sent_at"
        },

        cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "cancelled_at"
        },

        failedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "failed_at"
        },

        attachments: {
            type: DataTypes.JSONB,
            allowNull: true
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

        recipientCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "recipient_count"
        },

        deliveredCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "delivered_count"
        },

        failedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "failed_count"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "broadcasts",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["created_by"]
            },
            {
                fields: ["broadcast_type"]
            },
            {
                fields: ["audience_type"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["priority"]
            },
            {
                fields: ["scheduled_at"]
            },
            {
                fields: ["start_at"]
            },
            {
                fields: ["end_at"]
            },
            {
                fields: ["reference_type", "reference_id"]
            }
        ]
    }
);

module.exports = Broadcast;

