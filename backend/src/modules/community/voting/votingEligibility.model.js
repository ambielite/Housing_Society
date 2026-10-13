
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityVotingEligibility = sequelize.define(
    "CommunityVotingEligibility",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        votingId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "voting_id",
            references: {
                model: "community_votings",
                key: "id"
            }
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        eligibilityStatus: {
            type: DataTypes.ENUM(
                "ELIGIBLE",
                "INELIGIBLE",
                "SUSPENDED"
            ),
            allowNull: false,
            defaultValue: "ELIGIBLE",
            field: "eligibility_status"
        },

        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        hasVoted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "has_voted"
        },

        votedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "voted_at"
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
        tableName: "community_voting_eligibilities",
        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: ["voting_id", "user_id"]
            },
            {
                fields: ["voting_id"]
            },
            {
                fields: ["user_id"]
            }
        ]
    }
);

module.exports = CommunityVotingEligibility;

