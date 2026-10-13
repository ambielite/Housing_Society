
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityGovernanceMeeting = sequelize.define(
    "CommunityGovernanceMeeting",
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

        meetingId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "meeting_id",
            references: {
                model: "community_meetings",
                key: "id"
            }
        },

        governanceType: {
            type: DataTypes.ENUM(
                "AGM",
                "SGM"
            ),
            allowNull: false,
            field: "governance_type"
        },

        meetingNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "meeting_number"
        },

        financialYear: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "financial_year"
        },

        noticeDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "notice_date"
        },

        noticePublishedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "notice_published_at"
        },

        noticeDocument: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: "notice_document"
        },

        noticePeriodDays: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "notice_period_days"
        },

        agendaDocument: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: "agenda_document"
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

        eligibleMemberCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "eligible_member_count"
        },

        presentMemberCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "present_member_count"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "NOTICE_PUBLISHED",
                "SCHEDULED",
                "IN_PROGRESS",
                "QUORUM_CONFIRMED",
                "COMPLETED",
                "MINUTES_PENDING",
                "MINUTES_APPROVED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        chairmanId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "chairman_id"
        },

        secretaryId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "secretary_id"
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

        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "completed_at"
        },

        minutesApprovedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "minutes_approved_at"
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
        tableName: "community_governance_meetings",
        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["meeting_id"]
            },
            {
                fields: ["governance_type"]
            },
            {
                fields: ["financial_year"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = CommunityGovernanceMeeting;

