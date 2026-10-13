const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const ResidentKyc = sequelize.define(
    "ResidentKyc",
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
                "ADDRESS_PROOF",
                "RENT_AGREEMENT",
                "OWNERSHIP_PROOF",
                "POLICE_VERIFICATION",
                "OTHER"
            ),
            allowNull: false,
            field: "document_type"
        },

        documentName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "document_name"
        },

        documentNumber: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "document_number"
        },

        fileName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "file_name"
        },

        fileUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "file_url"
        },

        storageKey: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "storage_key"
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

        checksum: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        isEncrypted: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "is_encrypted"
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
                "VERIFIED",
                "REJECTED",
                "EXPIRED"
            ),
            defaultValue: "PENDING",
            field: "verification_status"
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

        verificationRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "verification_remarks"
        },

        accessLevel: {
            type: DataTypes.ENUM(
                "PRIVATE",
                "ADMIN_ONLY",
                "VERIFICATION_TEAM",
                "AUTHORIZED_STAFF"
            ),
            defaultValue: "ADMIN_ONLY",
            field: "access_level"
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "is_active"
        },

        archivedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "archived_at"
        },

        uploadedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "uploaded_by"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "resident_kyc_documents",

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
            }
        ]
    }
);

module.exports = ResidentKyc;