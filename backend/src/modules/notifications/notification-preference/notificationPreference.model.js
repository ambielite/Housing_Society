
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const NotificationPreference = sequelize.define(
    "NotificationPreference",
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

        channel: {
            type: DataTypes.ENUM(
                "IN_APP",
                "EMAIL",
                "SMS",
                "WHATSAPP"
            ),
            allowNull: false
        },

        enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },

        allowMarketing: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "allow_marketing"
        },

        allowOperational: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "allow_operational"
        },

        allowEmergency: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "allow_emergency"
        }
    },
    {
        tableName: "notification_preferences",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "user_id",
                    "channel"
                ]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["channel"]
            }
        ]
    }
);

module.exports = NotificationPreference;

