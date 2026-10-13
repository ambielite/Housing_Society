const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Tax = sequelize.define(
    "Tax",
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

        taxCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "tax_code"
        },

        taxName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "tax_name"
        },

        taxType: {
            type: DataTypes.ENUM(
                "GST",
                "CGST",
                "SGST",
                "IGST",
                "TDS",
                "OTHER"
            ),
            allowNull: false,
            field: "tax_type"
        },

        taxRate: {
            type: DataTypes.DECIMAL(8, 4),
            allowNull: false,
            validate: {
                min: 0,
                max: 100
            },
            field: "tax_rate"
        },

        calculationMethod: {
            type: DataTypes.ENUM(
                "PERCENTAGE",
                "FIXED"
            ),
            allowNull: false,
            defaultValue: "PERCENTAGE",
            field: "calculation_method"
        },

        fixedAmount: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "fixed_amount"
        },

        componentGroup: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "component_group"
        },

        applicableOn: {
            type: DataTypes.ENUM(
                "INVOICE",
                "BILLING",
                "PAYMENT",
                "VENDOR_PAYMENT",
                "OTHER"
            ),
            allowNull: false,
            defaultValue: "INVOICE",
            field: "applicable_on"
        },

        registrationNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "registration_number"
        },

        effectiveFrom: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "effective_from"
        },

        effectiveTo: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "effective_to"
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_active"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        metadata: {
            type: DataTypes.JSONB,
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
        tableName: "taxes",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "tax_code"
                ]
            },

            {
                fields: [
                    "tax_type"
                ]
            },

            {
                fields: [
                    "is_active"
                ]
            },

            {
                fields: [
                    "effective_from"
                ]
            }
        ]
    }
);

module.exports = Tax;