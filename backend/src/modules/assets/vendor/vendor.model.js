const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Vendor = sequelize.define(
    "Vendor",
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

        vendorCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "vendor_code"
        },

        companyName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "company_name"
        },

        contactPerson: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "contact_person"
        },

        phone: {
            type: DataTypes.STRING(30),
            allowNull: true
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: true
        },

        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        gstin: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        pan: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        serviceType: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "service_type"
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE",
                "BLACKLISTED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "vendors",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "vendor_code"
                ]
            },
            {
                fields: [
                    "society_id"
                ]
            },
            {
                fields: [
                    "company_name"
                ]
            },
            {
                fields: [
                    "status"
                ]
            },
            {
                fields: [
                    "service_type"
                ]
            }
        ]
    }
);

module.exports = Vendor;