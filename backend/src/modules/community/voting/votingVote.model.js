
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityVotingVote = sequelize.define(
    "CommunityVotingVote",
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

        optionId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "option_id",
            references: {
                model: "community_voting_options",
                key: "id"
            }
        },

        receiptHash: {
            type: DataTypes.STRING(64),
            allowNull: true,
            field: "receipt_hash"
        },

        castAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "cast_at"
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
        tableName: "community_voting_votes",
        timestamps: true,

        indexes: [
            {
                fields: ["voting_id"]
            },
            {
                fields: ["option_id"]
            }
        ]
    }
);

module.exports = CommunityVotingVote;

