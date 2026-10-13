
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const NotificationTemplate = sequelize.define(
    "NotificationTemplate",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "society_id",
            references: {
                model: "societies",
                key: "id"
            }
        },

        templateCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "template_code"
        },

        templateName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "template_name"
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

        subject: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        messageTemplate: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "message_template"
        },

        variables: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
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
        }
    },
    {
        tableName: "notification_templates",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "template_code",
                    "channel"
                ]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["template_code"]
            },
            {
                fields: ["channel"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = NotificationTemplate;
