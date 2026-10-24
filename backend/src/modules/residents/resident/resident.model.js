const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Resident = sequelize.define(
    "Resident",
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

        firstName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "first_name"
        },

        middleName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "middle_name"
        },

        lastName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "last_name"
        },

        displayName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "display_name"
        },

        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },

        mobile: {
            type: DataTypes.STRING(20),
            allowNull: false
        },

        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "date_of_birth"
        },

        alternateMobile: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "alternate_mobile"
        },

        emergencyContactName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "emergency_contact_name"
        },

        emergencyContactMobile: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "emergency_contact_mobile"
        },

        emergencyContactRelation: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "emergency_contact_relation"
        },

        role: {
            type: DataTypes.ENUM(
                "PRIMARY_OWNER",
                "CO_OWNER",
                "TENANT",
                "FAMILY_MEMBER",
                "PROPERTY_MANAGER"
            ),
            allowNull: false
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

        directoryPhoneVisible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "directory_phone_visible"
        },

        personalFields: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
            field: "personal_fields"
        },

        profilePhoto: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "profile_photo"
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
        tableName: "residents",

        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },

            {
                fields: ["mobile"]
            },

            {
                fields: ["email"]
            },

            {
                fields: ["status"]
            },

            {
                fields: ["role"]
            },

            {
                unique: true,
                fields: [
                    "society_id",
                    "mobile"
                ]
            }
        ]
    }
);

module.exports = Resident;
