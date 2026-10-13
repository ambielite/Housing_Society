const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const SocietySettings = sequelize.define(
    "SocietySettings",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,

            references: {
                model: "societies",
                key: "id"
            },

            field: "society_id",

            unique: true
        },

        // Billing Cycle
        billingCycle: {
            type: DataTypes.ENUM(
                "MONTHLY",
                "QUARTERLY",
                "HALF_YEARLY",
                "YEARLY"
            ),

            allowNull: false,

            defaultValue: "MONTHLY",

            field: "billing_cycle"
        },

        // Due Date
        dueDate: {
            type: DataTypes.INTEGER,
            allowNull: false,

            defaultValue: 10,

            field: "due_date",

            validate: {
                min: 1,
                max: 31
            }
        },

        // Penalty Rules
        penaltyRules: {
            type: DataTypes.JSONB,
            allowNull: false,

            defaultValue: {},

            field: "penalty_rules"
        },

        // Approval Hierarchy
        approvalHierarchy: {
            type: DataTypes.JSONB,
            allowNull: false,

            defaultValue: [],

            field: "approval_hierarchy"
        },

        // Visitor Categories
        visitorCategories: {
            type: DataTypes.JSONB,
            allowNull: false,

            defaultValue: [],

            field: "visitor_categories"
        },

        // Amenity Rules
        amenityRules: {
            type: DataTypes.JSONB,
            allowNull: false,

            defaultValue: {},

            field: "amenity_rules"
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
        tableName: "society_settings",

        timestamps: true
    }
);

module.exports = SocietySettings;