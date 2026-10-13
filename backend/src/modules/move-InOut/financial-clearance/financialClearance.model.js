const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const FinancialClearance = sequelize.define(
    "FinancialClearance",
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
            type: DataTypes.ENUM("MOVE_OUT"),
            allowNull: false,
            defaultValue: "MOVE_OUT",
            field: "lifecycle_type"
        },

        lifecycleId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "lifecycle_id"
        },

        outstandingAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: "outstanding_amount"
        },

        clearanceStatus: {
            type: DataTypes.ENUM(
                "PENDING",
                "CLEARED",
                "HOLD"
            ),
            allowNull: false,
            defaultValue: "PENDING",
            field: "clearance_status"
        },

        clearedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "cleared_by"
        },

        clearedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "cleared_at"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "financial_clearances",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = FinancialClearance;