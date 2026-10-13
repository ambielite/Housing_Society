const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const BillingConfig = sequelize.define(
    "BillingConfig",
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

        configType: {
            type: DataTypes.ENUM(
                "CHARGE_HEAD",
                "BILLING_RULE",
                "BILLING_CYCLE",
                "PENALTY_RULE"
            ),
            allowNull: false,
            field: "config_type"
        },

        code: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        chargeCategory: {
            type: DataTypes.ENUM(
                "MAINTENANCE",
                "PARKING",
                "AMENITY",
                "UTILITY",
                "OTHER"
            ),
            allowNull: true,
            field: "charge_category"
        },

        billingModel: {
            type: DataTypes.ENUM(
                "FLAT_RATE",
                "AREA_BASED",
                "HYBRID"
            ),
            allowNull: true,
            field: "billing_model"
        },

        flatAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            field: "flat_amount"
        },

        ratePerArea: {
            type: DataTypes.DECIMAL(15, 4),
            allowNull: true,
            field: "rate_per_area"
        },

        fixedAmount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            field: "fixed_amount"
        },

        billingFrequency: {
            type: DataTypes.ENUM(
                "MONTHLY",
                "QUARTERLY",
                "HALF_YEARLY",
                "YEARLY",
                "CUSTOM"
            ),
            allowNull: true,
            field: "billing_frequency"
        },

        billingDay: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "billing_day"
        },

        dueDays: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "due_days"
        },

        penaltyType: {
            type: DataTypes.ENUM(
                "PERCENTAGE",
                "FIXED_AMOUNT",
                "DAILY_FIXED",
                "DAILY_PERCENTAGE"
            ),
            allowNull: true,
            field: "penalty_type"
        },

        penaltyValue: {
            type: DataTypes.DECIMAL(15, 4),
            allowNull: true,
            field: "penalty_value"
        },

        gracePeriodDays: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            field: "grace_period_days"
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

        isTaxable: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "is_taxable"
        },

        taxRate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
            field: "tax_rate"
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "is_active"
        },

        description: {
            type: DataTypes.TEXT
        },

        remarks: {
            type: DataTypes.TEXT
        }
    },
    {
        tableName: "billing_configs",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "config_type",
                    "code"
                ]
            },
            {
                fields: [
                    "society_id",
                    "config_type"
                ]
            },
            {
                fields: [
                    "effective_from",
                    "effective_to"
                ]
            }
        ]
    }
);

module.exports = BillingConfig;