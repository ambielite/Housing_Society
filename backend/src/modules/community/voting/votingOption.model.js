
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityVotingOption = sequelize.define(
    "CommunityVotingOption",
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

        optionCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "option_code"
        },

        optionLabel: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "option_label"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        candidateUserId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "candidate_user_id"
        },

        candidateBio: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "candidate_bio"
        },

        candidateStatus: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "APPROVED",
            field: "candidate_status"
        },

        candidateReviewedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "candidate_reviewed_by"
        },

        candidateReviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "candidate_reviewed_at"
        },

        candidateRejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "candidate_rejection_reason"
        },

        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "display_order"
        },

        voteCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "vote_count"
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_active"
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
        tableName: "community_voting_options",
        timestamps: true,

        indexes: [
            {
                fields: ["voting_id"]
            },
            {
                fields: ["option_code"]
            }
        ]
    }
);

module.exports = CommunityVotingOption;

