const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityMeetingActionItem = sequelize.define(
    "CommunityMeetingActionItem",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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

        agendaId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "agenda_id",
            references: {
                model: "community_meeting_agendas",
                key: "id"
            }
        },

        assignedTo: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "assigned_to"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        priority: {
            type: DataTypes.ENUM(
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ),
            allowNull: false,
            defaultValue: "MEDIUM"
        },

        dueDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "due_date"
        },

        status: {
            type: DataTypes.ENUM(
                "OPEN",
                "IN_PROGRESS",
                "COMPLETED",
                "OVERDUE",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "OPEN"
        },

        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "completed_at"
        },

        completionNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "completion_note"
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
        tableName: "community_meeting_action_items",
        timestamps: true,

        indexes: [
            {
                fields: ["meeting_id"]
            },
            {
                fields: ["agenda_id"]
            },
            {
                fields: ["assigned_to"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["due_date"]
            }
        ]
    }
);

module.exports = CommunityMeetingActionItem;