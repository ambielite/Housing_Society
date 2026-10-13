
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const MaintenanceSchedule = sequelize.define(
    "MaintenanceSchedule",
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

        scheduleCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "schedule_code"
        },

        maintenanceTitle: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "maintenance_title"
        },

        maintenanceDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "maintenance_description"
        },

        frequencyType: {
            type: DataTypes.ENUM(
                "DAILY",
                "WEEKLY",
                "MONTHLY",
                "QUARTERLY",
                "HALF_YEARLY",
                "YEARLY",
                "CUSTOM"
            ),
            allowNull: false,
            field: "frequency_type"
        },

        frequencyValue: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "frequency_value"
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "start_date"
        },

        lastMaintenanceDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "last_maintenance_date"
        },

        nextDueDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "next_due_date"
        },

        estimatedCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "estimated_cost",
            validate: {
                min: 0
            }
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
                "ACTIVE",
                "PAUSED",
                "COMPLETED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        autoCreateWorkOrder: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "auto_create_work_order"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "maintenance_schedules",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "schedule_code"
                ]
            },
            {
                fields: [
                    "society_id"
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
                    "next_due_date"
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

module.exports = MaintenanceSchedule;

