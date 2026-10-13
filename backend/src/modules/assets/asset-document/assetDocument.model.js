
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AssetDocument = sequelize.define(
    "AssetDocument",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        assetId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "asset_id",
            references: {
                model: "assets",
                key: "id"
            }
        },

        documentType: {
            type: DataTypes.ENUM(
                "PURCHASE_INVOICE",
                "WARRANTY_CERTIFICATE",
                "AMC_DOCUMENT",
                "USER_MANUAL",
                "SERVICE_DOCUMENT",
                "INSURANCE_DOCUMENT",
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
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "document_number"
        },

        fileName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "file_name"
        },

        filePath: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: "file_path"
        },

        fileType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "file_type"
        },

        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: "file_size"
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

        warrantyStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "warranty_start_date"
        },

        warrantyEndDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "warranty_end_date"
        },

        warrantyProvider: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "warranty_provider"
        },

        warrantyRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "warranty_remarks"
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "EXPIRED",
                "INACTIVE"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "asset_documents",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["asset_id"]
            },
            {
                fields: ["document_type"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["expiry_date"]
            },
            {
                fields: ["warranty_end_date"]
            }
        ]
    }
);

module.exports = AssetDocument;

