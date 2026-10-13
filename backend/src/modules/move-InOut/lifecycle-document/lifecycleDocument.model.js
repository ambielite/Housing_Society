const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LifecycleDocument = sequelize.define(
    "LifecycleDocument",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        lifecycleType: {
            type: DataTypes.ENUM(
                "MOVE_IN",
                "MOVE_OUT"
            ),
            allowNull: false,
            field: "lifecycle_type"
        },

        lifecycleId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "lifecycle_id"
        },

        documentType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "document_type"
        },

        documentName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "document_name"
        },

        documentUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "document_url"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING_VERIFICATION",
                "VERIFIED",
                "REJECTED"
            ),
            allowNull: false,
            defaultValue: "PENDING_VERIFICATION"
        },

        uploadedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "uploaded_by"
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
        }
    },
    {
        tableName: "lifecycle_documents",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at"
    }
);

module.exports = LifecycleDocument;