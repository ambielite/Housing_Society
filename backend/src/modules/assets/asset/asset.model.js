const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Asset = sequelize.define(
    "Asset",
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

        assetCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "asset_code"
        },

        assetName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "asset_name"
        },

        assetType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "asset_type"
        },

        categoryId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "category_id",
            references: {
            model: "asset_categories",
            key: "id"
            }
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        purchaseDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "purchase_date"
        },

        purchaseCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "purchase_cost",
            validate: {
                min: 0
            }
        },

        invoiceNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "invoice_number"
        },

        serialNumber: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "serial_number"
        },

        modelNumber: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "model_number"
        },

        manufacturer: {
            type: DataTypes.STRING(150),
            allowNull: true
        },

        vendorId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "vendor_id"
        },

        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        towerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "tower_id"
        },

        floorId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "floor_id"
        },

        unitId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "unit_id"
        },

        commissionedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "commissioned_date"
        },

        status: {
            type: DataTypes.ENUM(
                "PURCHASED",
                "ACTIVE",
                "UNDER_MAINTENANCE",
                "DAMAGED",
                "LOST",
                "RETIRED",
                "DISPOSED"
            ),
            allowNull: false,
            defaultValue: "PURCHASED"
        },

        condition: {
            type: DataTypes.ENUM(
                "NEW",
                "GOOD",
                "FAIR",
                "DAMAGED",
                "CRITICAL"
            ),
            allowNull: false,
            defaultValue: "NEW"
        },

        currentValue: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "current_value",
            validate: {
                min: 0
            }
        },

        depreciationValue: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "depreciation_value",
            validate: {
                min: 0
            }
        },

        retirementDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "retirement_date"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "assets",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: ["society_id", "asset_code"]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["asset_type"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["tower_id"]
            },
            {
                fields: ["floor_id"]
            },
            {
                fields: ["unit_id"]
            },
            {
                fields: ["purchase_date"]
            }
        ]
    }
);

module.exports = Asset;