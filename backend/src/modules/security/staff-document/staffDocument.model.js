const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const StaffDocument = sequelize.define(
    "StaffDocument",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        staffId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "staff_id",
            references: {
                model: "staff",
                key: "id"
            }
        },

        documentType: {
            type: DataTypes.ENUM(
                "ID_PROOF",
                "PAN",
                "ADDRESS_PROOF",
                "POLICE_VERIFICATION",
                "EMPLOYMENT_PROOF",
                "CONTRACT",
                "MEDICAL_CERTIFICATE",
                "OTHER"
            ),
            allowNull: false,
            field: "document_type"
        },

        documentNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "document_number"
        },

        documentPath: {
            type: DataTypes.STRING(500),
            allowNull: false,
            field: "document_path"
        },

        issueDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "issue_date"
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
            allowNull: false,
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

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "created_at"
        },

        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "updated_at"
        }
    },
    {
        tableName: "staff_documents",
        timestamps: true,

        indexes: [
            {
                fields: [
                    "staff_id"
                ]
            },
            {
                fields: [
                    "document_type"
                ]
            },
            {
                fields: [
                    "verification_status"
                ]
            },
            {
                fields: [
                    "expiry_date"
                ]
            }
        ]
    }
);

module.exports = StaffDocument;