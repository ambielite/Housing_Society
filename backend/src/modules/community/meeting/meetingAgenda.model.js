
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityMeetingAgenda = sequelize.define(
    "CommunityMeetingAgenda",
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

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        agendaOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            field: "agenda_order"
        },

        discussionRequired: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "discussion_required"
        },

        decisionRequired: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "decision_required"
        },

        status: {
            type: DataTypes.ENUM(
                "OPEN",
                "DISCUSSED",
                "DEFERRED",
                "CLOSED"
            ),
            allowNull: false,
            defaultValue: "OPEN"
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
        tableName: "community_meeting_agendas",
        timestamps: true,

        indexes: [
            {
                fields: ["meeting_id"]
            },
            {
                fields: ["agenda_order"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = CommunityMeetingAgenda;

