const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const MoveOut = sequelize.define(
    "MoveOut",
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

        requestedMoveOutDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "requested_move_out_date"
        },

        effectiveMoveOutDate: { type: DataTypes.DATEONLY, allowNull: true, field: "effective_move_out_date" },
        gatePassCode: { type: DataTypes.STRING(6), allowNull: true, field: "gate_pass_code" },
        configuredCharges: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: "configured_charges" },
        revertBillingToOwner: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "revert_billing_to_owner" },
        chargesPaid: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: "charges_paid" },
        signedOffBy: { type: DataTypes.UUID, allowNull: true, field: "signed_off_by" },
        signedOffAt: { type: DataTypes.DATE, allowNull: true, field: "signed_off_at" },
        cancelledAt: { type: DataTypes.DATE, allowNull: true, field: "cancelled_at" },
        cancellationReason: { type: DataTypes.TEXT, allowNull: true, field: "cancellation_reason" },

        actualMoveOutDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "actual_move_out_date"
        },

        status: {
            type: DataTypes.ENUM(
                "REQUESTED",
                "CHECKLIST_PENDING",
                "DUES_PENDING",
                "FINANCIAL_CLEARANCE_PENDING",
                "UNDER_VERIFICATION",
                "APPROVED",
                "REJECTED",
                "MOVE_OUT_PASS_ISSUED",
                "ACCESS_REVOKED",
                "COMPLETED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "REQUESTED"
        },

        checklistCompleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "checklist_completed"
        },

        checklistTasks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [], field: "checklist_tasks" },

        outstandingAmount: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0,
            field: "outstanding_amount"
        },

        financialClearanceStatus: {
            type: DataTypes.ENUM(
                "PENDING",
                "CLEARED",
                "HOLD"
            ),
            defaultValue: "PENDING",
            field: "financial_clearance_status"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "approved_by"
        },

        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approved_at"
        }
    },
    {
        tableName: "move_outs",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at"
    }
);

module.exports = MoveOut;
