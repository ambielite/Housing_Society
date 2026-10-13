const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LifecycleApproval = sequelize.define(
    "LifecycleApproval",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        lifecycleType: {
            type: DataTypes.ENUM("MOVE_IN", "MOVE_OUT"),
            allowNull: false,
            field: "lifecycle_type"
        },

        lifecycleId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "lifecycle_id"
        },

        approvalType: {
            type: DataTypes.ENUM(
                "DOCUMENT_VERIFICATION",
                "MOVE_IN_APPROVAL",
                "MOVE_OUT_APPROVAL",
                "FINANCIAL_CLEARANCE"
            ),
            allowNull: false,
            field: "approval_type"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "APPROVED",
                "REJECTED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        assignedTo: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "assigned_to"
        },

        actionBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "action_by"
        },

        actionAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "action_at"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "lifecycle_approvals",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = LifecycleApproval;