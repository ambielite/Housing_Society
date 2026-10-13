const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const GatePass = sequelize.define(
    "GatePass",
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

        passType: {
            type: DataTypes.ENUM(
                "MOVE_IN",
                "MOVE_OUT"
            ),
            allowNull: false,
            field: "pass_type"
        },

        passCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: "pass_code"
        },

        validFrom: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "valid_from"
        },

        validUntil: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "valid_until"
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "USED",
                "EXPIRED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "verified_by"
        },

        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "verified_at"
        },

        usedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "used_at"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "gate_passes",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at"
    }
);

module.exports = GatePass;