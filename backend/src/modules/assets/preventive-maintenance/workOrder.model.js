
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const WorkOrder = sequelize.define(
    "WorkOrder",
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

        workOrderNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "work_order_number"
        },

        scheduleId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "schedule_id",
            references: {
                model: "maintenance_schedules",
                key: "id"
            }
        },

        assetId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "asset_id",
            references: {
                model: "assets",
                key: "id"
            }
        },

        amcId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "amc_id",
            references: {
                model: "amcs",
                key: "id"
            }
        },

        vendorId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "vendor_id",
            references: {
                model: "vendors",
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

        status: {
            type: DataTypes.ENUM(
                "OPEN",
                "ASSIGNED",
                "IN_PROGRESS",
                "ON_HOLD",
                "COMPLETED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "OPEN"
        },

        scheduledDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "scheduled_date"
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

        assignedTo: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "assigned_to"
        },

        estimatedCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "estimated_cost",
            validate: {
                min: 0
            }
        },

        actualCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "actual_cost",
            validate: {
                min: 0
            }
        },

        completionNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "completion_notes"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "work_orders",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "work_order_number"
                ]
            },
            {
                fields: [
                    "society_id"
                ]
            },
            {
                fields: [
                    "schedule_id"
                ]
            },
            {
                fields: [
                    "asset_id"
                ]
            },
            {
                fields: [
                    "amc_id"
                ]
            },
            {
                fields: [
                    "vendor_id"
                ]
            },
            {
                fields: [
                    "scheduled_date"
                ]
            },
            {
                fields: [
                    "status"
                ]
            },
            {
                fields: [
                    "priority"
                ]
            }
        ]
    }
);

module.exports = WorkOrder;

