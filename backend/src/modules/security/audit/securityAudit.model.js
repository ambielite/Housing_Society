const { DataTypes } = require("sequelize");

const sequelize = require("../../../config/database");

const SecurityAudit = sequelize.define(
    "SecurityAudit",
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

        userId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "user_id"
        },

        userType: {
            type: DataTypes.ENUM(
                "ADMIN",
                "SECURITY_STAFF",
                "SUPERVISOR",
                "RESIDENT",
                "SYSTEM",
                "OTHER"
            ),
            allowNull: false,
            defaultValue: "SYSTEM",
            field: "user_type"
        },

        userName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "user_name"
        },

        action: {
            type: DataTypes.ENUM(
                "CREATE",
                "UPDATE",
                "DELETE",
                "VIEW",
                "LOGIN",
                "LOGOUT",
                "APPROVE",
                "REJECT",
                "ASSIGN",
                "UNASSIGN",
                "START",
                "COMPLETE",
                "CANCEL",
                "VERIFY",
                "ACKNOWLEDGE",
                "RESOLVE",
                "CLOSE",
                "TRIGGER",
                "OTHER"
            ),
            allowNull: false
        },

        module: {
            type: DataTypes.ENUM(
                "STAFF",
                "STAFF_DOCUMENT",
                "STAFF_UNIT_MAPPING",
                "STAFF_ATTENDANCE",
                "SHIFT",
                "ROSTER",
                "STAFF_TASK",
                "CHECKPOINT",
                "PATROL",
                "INCIDENT",
                "EMERGENCY",
                "SECURITY_AUDIT",
                "OTHER"
            ),
            allowNull: false
        },

        entityId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "entity_id"
        },

        entityType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "entity_type"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        oldValues: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: "old_values"
        },

        newValues: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: "new_values"
        },

        ipAddress: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "ip_address"
        },

        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "user_agent"
        },

        deviceInfo: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "device_info"
        },

        requestId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "request_id"
        },

        severity: {
            type: DataTypes.ENUM(
                "INFO",
                "WARNING",
                "CRITICAL"
            ),
            allowNull: false,
            defaultValue: "INFO"
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "created_at"
        },

        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "updated_at"
        }
    },
    {
        tableName: "security_audits",

        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["action"]
            },
            {
                fields: ["module"]
            },
            {
                fields: ["entity_id"]
            },
            {
                fields: ["created_at"]
            },
            {
                fields: ["severity"]
            }
        ]
    }
);

module.exports = SecurityAudit;