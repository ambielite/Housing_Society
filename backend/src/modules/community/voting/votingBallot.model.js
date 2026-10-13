
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityVotingBallot = sequelize.define(
    "CommunityVotingBallot",
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

        eligibilityId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "eligibility_id",
            references: {
                model: "community_voting_eligibilities",
                key: "id"
            }
        },

        ballotTokenHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            field: "ballot_token_hash"
        },

        status: {
            type: DataTypes.ENUM(
                "ISSUED",
                "USED",
                "VOID"
            ),
            allowNull: false,
            defaultValue: "ISSUED"
        },

        issuedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "issued_at"
        },

        usedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "used_at"
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
        tableName: "community_voting_ballots",
        timestamps: true,

        indexes: [
            {
                fields: ["voting_id"]
            },
            {
                fields: ["eligibility_id"]
            }
        ]
    }
);

module.exports = CommunityVotingBallot;

