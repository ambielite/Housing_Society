const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

// Shared vendor record. The Sujal vendor API owns CRUD; this Sequelize model
// remains for associations from assets, AMCs, maintenance schedules, and work orders.
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
            field: "society_id"
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "user_id"
        },
        legalName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "legal_name"
        },
        tradeName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "trade_name"
        },
        pan: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        gstin: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        contactEmail: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "contact_email"
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        addressId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "address_id"
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "PENDING"
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
        updatedAt: "updated_at"
    }
);

module.exports = Vendor;
