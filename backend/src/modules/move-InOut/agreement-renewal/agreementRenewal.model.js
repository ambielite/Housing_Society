const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AgreementRenewal = sequelize.define(
    "AgreementRenewal",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        agreementId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "agreement_id"
        },

        existingAgreementReference: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "existing_agreement_reference"
        },

        currentExpiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "current_expiry_date"
        },

        proposedStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "proposed_start_date"
        },

        proposedExpiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "proposed_expiry_date"
        },

        updatedAgreementDetails: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: "updated_agreement_details"
        },

        updatedDocuments: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: "updated_documents"
        },

        renewalAgreementCopy: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "renewal_agreement_copy"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "ADDITIONAL_INFO_REQUIRED",
                "APPROVED",
                "REJECTED",
                "COMPLETED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        applicationDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "application_date"
        },

        approvalDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approval_date"
        },

        requestedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "requested_by"
        },

        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "approved_by"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "agreement_renewals",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = AgreementRenewal;