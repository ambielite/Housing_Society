
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityGovernanceRule = sequelize.define(
    "CommunityGovernanceRule",
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

        ruleCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "rule_code"
        },

        ruleName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "rule_name"
        },

        ruleType: {
            type: DataTypes.ENUM(
                "QUORUM",
                "ELIGIBILITY",
                "VOTING",
                "NOTICE",
                "TERM",
                "OTHER"
            ),
            allowNull: false,
            field: "rule_type"
        },

        configuration: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_active"
        },

        effectiveFrom: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "effective_from"
        },

        effectiveTo: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "effective_to"
        },

        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "created_by"
        },

        updatedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "updated_by"
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: "created_at"
        },

        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: "updated_at"
        }
    },
    {
        tableName: "community_governance_rules",
        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["rule_code"]
            },
            {
                fields: ["rule_type"]
            },
            {
                fields: ["is_active"]
            }
        ]
    }
);

module.exports = CommunityGovernanceRule;

