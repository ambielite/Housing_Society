const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Patrol = sequelize.define(
    "Patrol",
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

        patrolCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "patrol_code"
        },

        patrolName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "patrol_name"
        },

        patrolDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "patrol_date"
        },

        plannedStartTime: {
            type: DataTypes.TIME,
            allowNull: false,
            field: "planned_start_time"
        },

        plannedEndTime: {
            type: DataTypes.TIME,
            allowNull: false,
            field: "planned_end_time"
        },

        status: {
            type: DataTypes.ENUM(
                "SCHEDULED",
                "IN_PROGRESS",
                "COMPLETED",
                "MISSED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "SCHEDULED"
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

        totalCheckpoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "total_checkpoints"
        },

        completedCheckpoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "completed_checkpoints"
        },

        missedCheckpoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "missed_checkpoints"
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
        tableName: "security_patrols",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "patrol_code"
                ]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["staff_id"]
            },
            {
                fields: ["patrol_date"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = Patrol;