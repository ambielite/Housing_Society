const { DataTypes } = require("sequelize");

const sequelize = require("../../../config/database");

const Incident = sequelize.define(
    "Incident",
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

        incidentNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "incident_number"
        },

        incidentType: {
            type: DataTypes.ENUM(
                "SECURITY_BREACH",
                "THEFT",
                "FIRE",
                "MEDICAL",
                "ACCIDENT",
                "FIGHT",
                "VANDALISM",
                "UNAUTHORIZED_ACCESS",
                "VEHICLE",
                "PROPERTY_DAMAGE",
                "SAFETY_HAZARD",
                "OTHER"
            ),
            allowNull: false,
            field: "incident_type"
        },

        severity: {
            type: DataTypes.ENUM(
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ),
            allowNull: false,
            defaultValue: "MEDIUM"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        incidentDate: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "incident_date"
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

        assignedTo: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "assigned_to"
        },

        status: {
            type: DataTypes.ENUM(
                "REPORTED",
                "ACKNOWLEDGED",
                "UNDER_INVESTIGATION",
                "RESOLVED",
                "CLOSED",
                "REJECTED"
            ),
            allowNull: false,
            defaultValue: "REPORTED"
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

        investigationNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "investigation_notes"
        },

        resolutionDetails: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "resolution_details"
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

        evidenceDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "evidence_description"
        },

        policeComplaintNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "police_complaint_number"
        },

        policeComplaintDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "police_complaint_date"
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
        tableName: "security_incidents",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: ["society_id", "incident_number"]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["incident_type"]
            },
            {
                fields: ["severity"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["incident_date"]
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

module.exports = Incident;