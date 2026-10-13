
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityMeeting = sequelize.define(
    "CommunityMeeting",
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

        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "created_by"
        },

        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "approved_by"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        meetingType: {
            type: DataTypes.ENUM(
                "GENERAL",
                "COMMITTEE",
                "BOARD",
                "AGM",
                "SGM",
                "EMERGENCY",
                "OTHER"
            ),
            allowNull: false,
            defaultValue: "GENERAL",
            field: "meeting_type"
        },

        venue: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        meetingLink: {
            type: DataTypes.STRING(1000),
            allowNull: true,
            field: "meeting_link"
        },

        scheduledAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "scheduled_at"
        },

        endAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "end_at"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "SCHEDULED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        approvalNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "approval_note"
        },

        cancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "cancellation_reason"
        },

        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approved_at"
        },

        startedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "started_at"
        },

        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "completed_at"
        },

        cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "cancelled_at"
        },

        remarks: {
            type: DataTypes.TEXT,
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
        tableName: "community_meetings",
        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["created_by"]
            },
            {
                fields: ["meeting_type"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["scheduled_at"]
            }
        ]
    }
);

module.exports = CommunityMeeting;

