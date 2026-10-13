const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const StaffTask = sequelize.define(
    "StaffTask",
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

        staffId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "staff_id",
            references: {
                model: "staff",
                key: "id"
            }
        },

        assignedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "assigned_by"
        },

        title: {
            type: DataTypes.STRING(200),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        taskType: {
            type: DataTypes.ENUM(
                "SECURITY",
                "HOUSEKEEPING",
                "MAINTENANCE",
                "INSPECTION",
                "PATROL",
                "EMERGENCY",
                "OTHER"
            ),
            allowNull: false,
            defaultValue: "OTHER",
            field: "task_type"
        },

        priority: {
            type: DataTypes.ENUM(
                "LOW",
                "MEDIUM",
                "HIGH",
                "URGENT"
            ),
            allowNull: false,
            defaultValue: "MEDIUM"
        },

        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "due_date"
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

        status: {
            type: DataTypes.ENUM(
                "ASSIGNED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                "OVERDUE"
            ),
            allowNull: false,
            defaultValue: "ASSIGNED"
        },

        completionRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "completion_remarks"
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
        tableName: "staff_tasks",
        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["staff_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["priority"]
            },
            {
                fields: ["task_type"]
            },
            {
                fields: ["due_date"]
            }
        ]
    }
);

module.exports = StaffTask;