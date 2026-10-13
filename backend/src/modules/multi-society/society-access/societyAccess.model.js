const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const SocietyAccess = sequelize.define(
    "SocietyAccess",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        organizationId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "organization_id"
        },

        clusterId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "cluster_id"
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "society_id"
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        accessType: {
            type: DataTypes.ENUM(
                "OWNER",
                "ADMIN",
                "MANAGER",
                "DELEGATED_ADMIN",
                "VIEWER"
            ),
            allowNull: false,
            defaultValue: "VIEWER",
            field: "access_type"
        },

        isDefault: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_default"
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_active"
        },

        validFrom: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "valid_from"
        },

        validUntil: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "valid_until"
        },

        permissions: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "society_accesses",
        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "user_id",
                    "society_id"
                ]
            },
            {
                fields: [
                    "organization_id"
                ]
            },
            {
                fields: [
                    "cluster_id"
                ]
            },
            {
                fields: [
                    "society_id"
                ]
            },
            {
                fields: [
                    "user_id"
                ]
            }
        ]
    }
);

module.exports = SocietyAccess;