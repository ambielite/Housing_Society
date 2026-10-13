const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const ResidentVerification = sequelize.define(
    "ResidentVerification",
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

        residentId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "resident_id"
        },

        verificationType: {
            type: DataTypes.ENUM(
                "INITIAL_REGISTRATION",
                "KYC",
                "OWNER_VERIFICATION",
                "TENANT_VERIFICATION",
                "PROFILE_UPDATE",
                "DOCUMENT_REVERIFICATION"
            ),
            allowNull: false,
            defaultValue: "INITIAL_REGISTRATION",
            field: "verification_type"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "APPROVED",
                "REJECTED",
                "MORE_INFORMATION_REQUIRED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        submittedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "submitted_at"
        },

        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "reviewed_at"
        },

        reviewedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "reviewed_by"
        },

        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "rejection_reason"
        },

        informationRequest: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "information_request"
        },

        reviewerRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "reviewer_remarks"
        },

        submittedDocuments: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
            field: "submitted_documents"
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        }
    },
    {
        tableName: "resident_verifications",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["resident_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["verification_type"]
            }
        ]
    }
);

module.exports = ResidentVerification;