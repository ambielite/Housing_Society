const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const KycDocument = sequelize.define(
    "KycDocument",
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

        stakeholderId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "stakeholder_id"
        },

        documentType: {
            type: DataTypes.ENUM(
                "AADHAAR",
                "PAN",
                "PASSPORT",
                "DRIVING_LICENSE",
                "VOTER_ID",
                "RENT_AGREEMENT",
                "SALE_DEED",
                "PROPERTY_DOCUMENT",
                "ADDRESS_PROOF",
                "IDENTITY_PROOF",
                "OTHER"
            ),
            allowNull: false,
            field: "document_type"
        },

        documentNumber: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "document_number"
        },

        documentName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "document_name"
        },

        fileName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "file_name"
        },

        filePath: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "file_path"
        },

        fileUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "file_url"
        },

        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "mime_type"
        },

        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "file_size"
        },

        issuedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "issued_date"
        },

        expiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "expiry_date"
        },

        verificationStatus: {
            type: DataTypes.ENUM(
                "PENDING",
                "APPROVED",
                "REJECTED",
                "REQUEST_MORE_INFORMATION"
            ),
            allowNull: false,
            defaultValue: "PENDING",
            field: "verification_status"
        },

        uploadedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "uploaded_at"
        },

        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "verified_at"
        },

        verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "verified_by"
        },

        verificationRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "verification_remarks"
        },

        isSensitive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_sensitive"
        },

        accessLevel: {
            type: DataTypes.ENUM(
                "ADMIN_ONLY",
                "MANAGEMENT",
                "AUTHORIZED_STAFF"
            ),
            allowNull: false,
            defaultValue: "ADMIN_ONLY",
            field: "access_level"
        },

        isArchived: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_archived"
        },

        archivedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "archived_at"
        },

        archivedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "archived_by"
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "kyc_documents",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["stakeholder_id"]
            },
            {
                fields: ["document_type"]
            },
            {
                fields: ["verification_status"]
            },
            {
                fields: ["expiry_date"]
            },
            {
                fields: ["is_archived"]
            }
        ]
    }
);

module.exports = KycDocument;