const { DataTypes } = require("sequelize");

const sequelize = require("../../../config/database");

const Emergency = sequelize.define(
    "Emergency",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "society_id"
        },

        emergencyNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "emergency_number"
        },

        emergencyType: {
            type: DataTypes.ENUM(
                "FIRE",
                "MEDICAL",
                "SECURITY_BREACH",
                "THEFT",
                "ACCIDENT",
                "ELECTRICAL",
                "WATER_LEAKAGE",
                "FLOOD",
                "GAS_LEAK",
                "MISSING_PERSON",
                "NATURAL_DISASTER",
                "VIOLENCE",
                "OTHER"
            ),
            allowNull: false,
            field: "emergency_type"
        },

        priority: {
            type: DataTypes.ENUM(
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ),
            allowNull: false,
            defaultValue: "HIGH"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        reportedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "reported_at"
        },

        reportedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "reported_by"
        },

        reportedByName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "reported_by_name"
        },

        reportedByMobile: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "reported_by_mobile"
        },

        unitId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "unit_id"
        },

        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        latitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true
        },

        longitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true
        },

        assignedTo: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "assigned_to"
        },

        status: {
            type: DataTypes.ENUM(
                "TRIGGERED",
                "ACKNOWLEDGED",
                "RESPONDING",
                "RESOLVED",
                "CLOSED",
                "CANCELLED",
                "FALSE_ALARM"
            ),
            allowNull: false,
            defaultValue: "TRIGGERED"
        },

        acknowledgedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "acknowledged_at"
        },

        responseStartedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "response_started_at"
        },

        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "resolved_at"
        },

        closedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "closed_at"
        },

        responseNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "response_notes"
        },

        resolutionDetails: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "resolution_details"
        },

        externalReference: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "external_reference"
        },

        policeContacted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "police_contacted"
        },

        ambulanceContacted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "ambulance_contacted"
        },

        fireBrigadeContacted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "fire_brigade_contacted"
        },

        emergencyContacted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "emergency_contacted"
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
        tableName: "security_emergencies",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: ["society_id", "emergency_number"]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["emergency_type"]
            },
            {
                fields: ["priority"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["reported_at"]
            },
            {
                fields: ["assigned_to"]
            },
            {
                fields: ["unit_id"]
            }
        ]
    }
);

module.exports = Emergency;