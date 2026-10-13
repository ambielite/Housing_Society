const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityMeetingAttendance = sequelize.define(
    "CommunityMeetingAttendance",
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

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        attendanceStatus: {
            type: DataTypes.ENUM(
                "PRESENT",
                "ABSENT",
                "LATE",
                "EXCUSED"
            ),
            allowNull: false,
            defaultValue: "PRESENT",
            field: "attendance_status"
        },

        checkInAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "check_in_at"
        },

        checkOutAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "check_out_at"
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
        tableName: "community_meeting_attendance",
        timestamps: true,

        indexes: [
            {
                fields: ["meeting_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["attendance_status"]
            },
            {
                unique: true,
                fields: ["meeting_id", "user_id"]
            }
        ]
    }
);

module.exports = CommunityMeetingAttendance;