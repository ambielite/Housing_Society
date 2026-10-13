const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Occupancy = sequelize.define(
    "Occupancy",
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

        unitId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "unit_id"
        },

        residentId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "resident_id"
        },

        occupancyType: {
            type: DataTypes.ENUM(
                "OWNER",
                "TENANT"
            ),
            allowNull: false,
            field: "occupancy_type"
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "start_date"
        },

        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "end_date"
        },

        billingStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "billing_start_date"
        },

        billingEndDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "billing_end_date"
        },

        isCurrent: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "is_current"
        }
    },
    {
        tableName: "occupancies",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at"
    }
);

module.exports = Occupancy;