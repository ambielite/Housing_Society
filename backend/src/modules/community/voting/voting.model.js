
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityVoting = sequelize.define(
    "CommunityVoting",
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

        governanceMeetingId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "governance_meeting_id",
            references: {
                model: "community_governance_meetings",
                key: "id"
            }
        },

        meetingId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "meeting_id",
            references: {
                model: "community_meetings",
                key: "id"
            }
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        votingType: {
            type: DataTypes.ENUM(
                "RESOLUTION",
                "ELECTION",
                "POLL",
                "AGM",
                "SGM",
                "OTHER"
            ),
            allowNull: false,
            field: "voting_type"
        },

        ballotType: {
            type: DataTypes.ENUM(
                "SINGLE_CHOICE",
                "MULTIPLE_CHOICE",
                "YES_NO",
                "ELECTION"
            ),
            allowNull: false,
            defaultValue: "SINGLE_CHOICE",
            field: "ballot_type"
        },

        secrecy: {
            type: DataTypes.ENUM(
                "OPEN",
                "SECRET"
            ),
            allowNull: false,
            defaultValue: "SECRET"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "SCHEDULED",
                "OPEN",
                "CLOSED",
                "COUNTING",
                "RESULT_DECLARED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        startAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "start_at"
        },

        endAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "end_at"
        },

        quorumRequired: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "quorum_required"
        },

        quorumReached: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "quorum_reached"
        },

        eligibleVoterCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "eligible_voter_count"
        },

        voteCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "vote_count"
        },

        resultData: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: "result_data"
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

        resultDeclaredAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "result_declared_at"
        },

        cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "cancelled_at"
        },

        cancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "cancellation_reason"
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
        tableName: "community_votings",
        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["governance_meeting_id"]
            },
            {
                fields: ["meeting_id"]
            },
            {
                fields: ["voting_type"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["start_at"]
            },
            {
                fields: ["end_at"]
            }
        ]
    }
);

module.exports = CommunityVoting;

