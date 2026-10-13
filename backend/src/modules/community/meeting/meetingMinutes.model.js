const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityMeetingMinutes = sequelize.define(
    "CommunityMeetingMinutes",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        meetingId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            field: "meeting_id",
            references: {
                model: "community_meetings",
                key: "id"
            }
        },

        preparedBy: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "prepared_by"
        },

        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "approved_by"
        },

        summary: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        discussionSummary: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "discussion_summary"
        },

        decisions: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: []
        },

        attachments: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: []
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "SUBMITTED",
                "APPROVED",
                "REJECTED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        approvalNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "approval_note"
        },

        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approved_at"
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
        tableName: "community_meeting_minutes",
        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: ["meeting_id"]
            },
            {
                fields: ["prepared_by"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = CommunityMeetingMinutes;