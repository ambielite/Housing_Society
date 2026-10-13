const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Agreement = sequelize.define(
    "Agreement",
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

        ownerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "owner_id"
        },

        tenantId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "tenant_id"
        },

        agreementReference: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: "agreement_reference"
        },

        agreementType: {
            type: DataTypes.ENUM(
                "RENTAL",
                "LEASE",
                "TENANCY",
                "LEAVE_AND_LICENSE",
                "OTHER"
            ),
            allowNull: false,
            field: "agreement_type"
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "start_date"
        },

        expiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "expiry_date"
        },

        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Agreement duration in months"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "SUBMITTED",
                "UNDER_VERIFICATION",
                "APPROVED",
                "ACTIVE",
                "EXPIRING_SOON",
                "RENEWAL_INITIATED",
                "RENEWED",
                "EXPIRED",
                "TERMINATED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        agreementDocument: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "agreement_document"
        },

        signedAgreementCopy: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "signed_agreement_copy"
        },

        uploadedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "uploaded_at"
        },

        signedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "signed_at"
        },

        renewalStatus: {
            type: DataTypes.ENUM(
                "NOT_REQUIRED",
                "PENDING",
                "INITIATED",
                "IN_PROGRESS",
                "APPROVED",
                "REJECTED",
                "RENEWED"
            ),
            allowNull: false,
            defaultValue: "NOT_REQUIRED",
            field: "renewal_status"
        },

        renewalApplicationDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "renewal_application_date"
        },

        renewalApprovalDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "renewal_approval_date"
        },

        renewalAgreementDocument: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "renewal_agreement_document"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "agreements",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = Agreement;