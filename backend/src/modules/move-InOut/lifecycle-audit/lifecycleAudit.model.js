const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LifecycleAudit = sequelize.define(
    "LifecycleAudit",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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

        action: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        previousStatus: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "previous_status"
        },

        newStatus: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "new_status"
        },

        performedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "performed_by"
        },

        performedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "performed_at"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    },
    {
        tableName: "lifecycle_audits",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = LifecycleAudit;