
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const StockTransaction = sequelize.define(
    "StockTransaction",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        transactionNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: "transaction_number"
        },

        inventoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "inventory_id",
            references: {
                model: "inventory",
                key: "id"
            }
        },

        transactionType: {
            type: DataTypes.ENUM(
                "STOCK_IN",
                "STOCK_OUT",
                "TRANSFER",
                "ADJUSTMENT",
                "RETURN"
            ),
            allowNull: false,
            field: "transaction_type"
        },

        quantity: {
            type: DataTypes.DECIMAL(14, 3),
            allowNull: false,
            validate: {
                min: 0.001
            }
        },

        previousStock: {
            type: DataTypes.DECIMAL(14, 3),
            allowNull: false,
            field: "previous_stock"
        },

        newStock: {
            type: DataTypes.DECIMAL(14, 3),
            allowNull: false,
            field: "new_stock"
        },

        sourceInventoryId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "source_inventory_id"
        },

        destinationInventoryId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "destination_inventory_id"
        },

        referenceNumber: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "reference_number"
        },

        referenceType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "reference_type"
        },

        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        transactionDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "transaction_date"
        },

        performedBy: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "performed_by"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "stock_transactions",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["inventory_id"]
            },
            {
                fields: ["transaction_type"]
            },
            {
                fields: ["transaction_date"]
            },
            {
                fields: ["source_inventory_id"]
            },
            {
                fields: ["destination_inventory_id"]
            },
            {
                fields: ["reference_number"]
            }
        ]
    }
);

module.exports = StockTransaction;

