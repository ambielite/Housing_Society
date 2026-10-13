
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AssetMaintenance = sequelize.define(
    "AssetMaintenance",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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

        maintenanceType: {
            type: DataTypes.ENUM(
                "PREVENTIVE",
                "CORRECTIVE",
                "BREAKDOWN",
                "INSPECTION",
                "SERVICING",
                "REPAIR",
                "OTHER"
            ),
            allowNull: false,
            field: "maintenance_type"
        },

        maintenanceStatus: {
            type: DataTypes.ENUM(
                "SCHEDULED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "SCHEDULED",
            field: "maintenance_status"
        },

        serviceDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "service_date"
        },

        completionDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "completion_date"
        },

        issueReported: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "issue_reported"
        },

        workPerformed: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "work_performed"
        },

        technicianName: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "technician_name"
        },

        technicianContact: {
            type: DataTypes.STRING(30),
            allowNull: true,
            field: "technician_contact"
        },

        vendorId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "vendor_id"
        },

        invoiceNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "invoice_number"
        },

        maintenanceCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "maintenance_cost",
            validate: {
                min: 0
            }
        },

        partsCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "parts_cost",
            validate: {
                min: 0
            }
        },

        laborCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: true,
            field: "labor_cost",
            validate: {
                min: 0
            }
        },

        downtimeHours: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "downtime_hours",
            validate: {
                min: 0
            }
        },

        nextServiceDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "next_service_date"
        },

        warrantyCovered: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "warranty_covered"
        },

        warrantyClaimNumber: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "warranty_claim_number"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "asset_maintenance",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["asset_id"]
            },
            {
                fields: ["maintenance_type"]
            },
            {
                fields: ["maintenance_status"]
            },
            {
                fields: ["service_date"]
            },
            {
                fields: ["next_service_date"]
            },
            {
                fields: ["vendor_id"]
            }
        ]
    }
);

module.exports = AssetMaintenance;

