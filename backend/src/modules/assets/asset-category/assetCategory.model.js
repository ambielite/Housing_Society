const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AssetCategory = sequelize.define(
    "AssetCategory",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "society_id",
            references: {
                model: "societies",
                key: "id"
            }
        },

        categoryCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "category_code"
        },

        categoryName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "category_name"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
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
        tableName: "asset_categories",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "category_code"
                ]
            },
            {
                unique: true,
                fields: [
                    "society_id",
                    "category_name"
                ]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = AssetCategory;