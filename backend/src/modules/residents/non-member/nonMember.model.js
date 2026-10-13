const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const NonMember = sequelize.define(
    "NonMember",
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

        memberType: {
            type: DataTypes.ENUM(
                "SHOP",
                "SERVICE_PROVIDER",
                "TUTOR",
                "COMMERCIAL_OCCUPANT",
                "DOMESTIC_WORKER",
                "CONTRACTOR",
                "VENDOR",
                "OTHER"
            ),
            allowNull: false,
            field: "member_type"
        },

        name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },

        organizationName: {
            type: DataTypes.STRING(200),
            allowNull: true,
            field: "organization_name"
        },

        businessName: {
            type: DataTypes.STRING(200),
            allowNull: true,
            field: "business_name"
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: true
        },

        mobile: {
            type: DataTypes.STRING(20),
            allowNull: false
        },

        alternateMobile: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "alternate_mobile"
        },

        emergencyContactName: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "emergency_contact_name"
        },

        emergencyContactMobile: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "emergency_contact_mobile"
        },

        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        unitId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "unit_id"
        },

        shopNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "shop_number"
        },

        serviceDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "service_description"
        },

        identityDocumentType: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "identity_document_type"
        },

        identityDocumentNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "identity_document_number"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "ACTIVE",
                "SUSPENDED",
                "BLACKLISTED",
                "ARCHIVED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "start_date"
        },

        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "end_date"
        },

        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "approved_by"
        },

        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approved_at"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        customFields: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
            field: "custom_fields"
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        }
    },
    {
        tableName: "non_members",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["member_type"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["mobile"]
            },
            {
                fields: ["unit_id"]
            }
        ]
    }
);

module.exports = NonMember;