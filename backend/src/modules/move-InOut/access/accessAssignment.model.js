const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AccessAssignment = sequelize.define(
    "AccessAssignment",
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

        unitId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "unit_id"
        },

        residentId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "resident_id"
        },

        lifecycleType: {
            type: DataTypes.ENUM(
                "MOVE_IN",
                "MOVE_OUT"
            ),
            allowNull: false,
            field: "lifecycle_type"
        },

        lifecycleId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "lifecycle_id"
        },

        accessType: {
            type: DataTypes.ENUM(
                "RESIDENT",
                "OWNER",
                "TENANT",
                "VEHICLE",
                "GATE",
                "COMMON_AREA"
            ),
            allowNull: false,
            field: "access_type"
        },

        accessStatus: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "REVOKED",
                "SUSPENDED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE",
            field: "access_status"
        },

        activatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "activated_at"
        },

        revokedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "revoked_at"
        },

        activatedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "activated_by"
        },

        revokedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "revoked_by"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "access_assignments",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at"
    }
);

module.exports = AccessAssignment;