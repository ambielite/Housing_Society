const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const BillingResponsibility = sequelize.define(
    "BillingResponsibility",
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

        responsibilityType: {
            type: DataTypes.ENUM(
                "OWNER",
                "TENANT"
            ),
            allowNull: false,
            field: "responsibility_type"
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

        isCurrent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_current"
        },

        billingAccountId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "billing_account_id"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "billing_responsibilities",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at"
    }
);

module.exports = BillingResponsibility;