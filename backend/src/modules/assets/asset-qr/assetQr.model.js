
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AssetQr = sequelize.define(
    "AssetQr",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        assetId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            field: "asset_id",
            references: {
                model: "assets",
                key: "id"
            }
        },

        qrCode: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            field: "qr_code"
        },

        qrValue: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true,
            field: "qr_value"
        },

        qrImagePath: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: "qr_image_path"
        },

        generatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "generated_at"
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
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
        tableName: "asset_qr_tags",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: ["asset_id"]
            },
            {
                unique: true,
                fields: ["qr_code"]
            },
            {
                unique: true,
                fields: ["qr_value"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = AssetQr;

