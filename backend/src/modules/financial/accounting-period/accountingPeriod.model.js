const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AccountingPeriod = sequelize.define(
    "AccountingPeriod",
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

        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "start_date"
        },

        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "end_date"
        },

        status: {
            type: DataTypes.ENUM(
                "OPEN",
                "CLOSED",
                "LOCKED"
            ),
            allowNull: false,
            defaultValue: "OPEN"
        },

        lockedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "locked_at"
        },

        lockedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "locked_by"
        },

        closedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "closed_at"
        },

        closedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "closed_by"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "accounting_periods",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["society_id", "status"]
            },
            {
                unique: true,
                fields: [
                    "society_id",
                    "start_date",
                    "end_date"
                ]
            }
        ]
    }
);

module.exports = AccountingPeriod;