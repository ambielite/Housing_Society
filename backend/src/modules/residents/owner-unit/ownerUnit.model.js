const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const OwnerUnit = sequelize.define(
    "OwnerUnit",
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

        ownerId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "owner_id"
        },

        unitId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "unit_id"
        },

        ownershipType: {
            type: DataTypes.ENUM(
                "PRIMARY_OWNER",
                "CO_OWNER"
            ),
            allowNull: false,
            defaultValue: "CO_OWNER",
            field: "ownership_type"
        },

        ownershipPercentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            field: "ownership_percentage"
        },

        effectiveFrom: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "effective_from"
        },

        effectiveTo: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "effective_to"
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "owner_units",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["owner_id"]
            },
            {
                fields: ["unit_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: [
                    "owner_id",
                    "unit_id"
                ]
            }
        ]
    }
);

module.exports = OwnerUnit;