const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const MoveIn = sequelize.define(
    "MoveIn",
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

        occupancyType: {
            type: DataTypes.ENUM(
                "OWNER",
                "TENANT"
            ),
            allowNull: false,
            field: "occupancy_type"
        },

        requestedMoveInDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "requested_move_in_date"
        },

        agreementId: { type: DataTypes.UUID, allowNull: true, field: "agreement_id" },
        leaseDocument: { type: DataTypes.TEXT, allowNull: true, field: "lease_document" },
        registryDocument: { type: DataTypes.TEXT, allowNull: true, field: "registry_document" },
        policeVerificationDocument: { type: DataTypes.TEXT, allowNull: true, field: "police_verification_document" },
        gatePassCode: { type: DataTypes.STRING(6), allowNull: true, field: "gate_pass_code" },
        informationRequest: { type: DataTypes.TEXT, allowNull: true, field: "information_request" },

        actualMoveInDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "actual_move_in_date"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING_DOCUMENTS",
                "DOCUMENTS_SUBMITTED",
                "UNDER_VERIFICATION",
                "INFORMATION_REQUIRED",
                "APPROVED",
                "REJECTED",
                "GATE_PASS_ISSUED",
                "LEDGER_CREATED",
                "ACCESS_ACTIVATED",
                "COMPLETED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "PENDING_DOCUMENTS"
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
        tableName: "move_ins",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at"
    }
);

module.exports = MoveIn;
