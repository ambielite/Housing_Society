
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Inventory = sequelize.define(
    "Inventory",
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

        itemCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "item_code"
        },

        itemName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "item_name"
        },

        category: {
            type: DataTypes.STRING(150),
            allowNull: true
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        unitOfMeasure: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "unit_of_measure"
        },

        currentStock: {
            type: DataTypes.DECIMAL(14, 3),
            allowNull: false,
            defaultValue: 0,
            field: "current_stock",
            validate: {
                min: 0
            }
        },

        minimumStockLevel: {
            type: DataTypes.DECIMAL(14, 3),
            allowNull: false,
            defaultValue: 0,
            field: "minimum_stock_level",
            validate: {
                min: 0
            }
        },

        reorderLevel: {
            type: DataTypes.DECIMAL(14, 3),
            allowNull: false,
            defaultValue: 0,
            field: "reorder_level",
            validate: {
                min: 0
            }
        },

        maximumStockLevel: {
            type: DataTypes.DECIMAL(14, 3),
            allowNull: true,
            field: "maximum_stock_level",
            validate: {
                min: 0
            }
        },

        unitCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "unit_cost",
            validate: {
                min: 0
            }
        },

        storageLocation: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "storage_location"
        },

        binNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "bin_number"
        },

        vendorId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "vendor_id"
        },

        lastStockInDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "last_stock_in_date"
        },

        lastStockOutDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "last_stock_out_date"
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
        tableName: "inventory",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "item_code"
                ]
            },
            {
                unique: true,
                fields: [
                    "society_id",
                    "item_name"
                ]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["category"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["vendor_id"]
            },
            {
                fields: ["storage_location"]
            }
        ]
    }
);

module.exports = Inventory;

