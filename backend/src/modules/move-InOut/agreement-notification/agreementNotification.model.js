const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AgreementNotification = sequelize.define(
    "AgreementNotification",
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

        reminderId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "reminder_id"
        },

        notificationType: {
            type: DataTypes.ENUM(
                "AGREEMENT_EXPIRY",
                "FIRST_REMINDER",
                "SECOND_REMINDER",
                "FINAL_REMINDER",
                "EXPIRY_ALERT",
                "RENEWAL_SUBMITTED",
                "RENEWAL_APPROVED",
                "RENEWAL_REJECTED"
            ),
            allowNull: false,
            field: "notification_type"
        },

        recipient: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        recipientName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "recipient_name"
        },

        channel: {
            type: DataTypes.ENUM(
                "IN_APP",
                "EMAIL",
                "WHATSAPP",
                "SMS"
            ),
            allowNull: false
        },

        subject: {
            type: DataTypes.STRING(500),
            allowNull: true
        },

        message: {
            type: DataTypes.TEXT,
            allowNull: false
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

        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "read_at"
        },

        deliveryStatus: {
            type: DataTypes.ENUM(
                "PENDING",
                "PROCESSING",
                "SENT",
                "DELIVERED",
                "READ",
                "FAILED",
                "SKIPPED"
            ),
            allowNull: false,
            defaultValue: "PENDING",
            field: "delivery_status"
        },

        failureReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "failure_reason"
        },

        providerMessageId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "provider_message_id"
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    },
    {
        tableName: "agreement_notifications",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = AgreementNotification;