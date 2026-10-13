const { DataTypes } = require("sequelize");

const sequelize =
    require("../../../config/database");

const StaffAttendance = sequelize.define(
    "StaffAttendance",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        staffId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "staff_id",
            references: {
                model: "staff",
                key: "id"
            }
        },

        attendanceDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "attendance_date"
        },

        checkInTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "check_in_time"
        },

        checkOutTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "check_out_time"
        },

        status: {
            type: DataTypes.ENUM(
                "PRESENT",
                "ABSENT",
                "LATE",
                "HALF_DAY",
                "ON_LEAVE"
            ),
            allowNull: false,
            defaultValue: "PRESENT"
        },

        workingMinutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "working_minutes",
            validate: {
                min: 0
            }
        },

        overtimeMinutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            field: "overtime_minutes",
            validate: {
                min: 0
            }
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        markedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "marked_by"
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
        tableName: "staff_attendance",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "staff_id",
                    "attendance_date"
                ]
            },
            {
                fields: [
                    "staff_id"
                ]
            },
            {
                fields: [
                    "attendance_date"
                ]
            },
            {
                fields: [
                    "status"
                ]
            }
        ]
    }
);

module.exports = StaffAttendance;