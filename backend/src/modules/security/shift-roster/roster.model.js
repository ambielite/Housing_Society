const { DataTypes } = require("sequelize");

const sequelize =
    require("../../../config/database");

const Roster = sequelize.define(
    "Roster",
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

        staffId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "staff_id",
            references: {
                model: "staff",
                key: "id"
            }
        },

        shiftId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "shift_id",
            references: {
                model: "shifts",
                key: "id"
            }
        },

        rosterDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "roster_date"
        },

        rosterType: {
            type: DataTypes.ENUM(
                "DAILY",
                "WEEKLY",
                "MONTHLY"
            ),
            allowNull: false,
            defaultValue: "DAILY",
            field: "roster_type"
        },

        status: {
            type: DataTypes.ENUM(
                "SCHEDULED",
                "CONFIRMED",
                "CANCELLED",
                "COMPLETED"
            ),
            allowNull: false,
            defaultValue: "SCHEDULED"
        },

        assignedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "assigned_by"
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
        tableName: "staff_rosters",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "staff_id",
                    "roster_date"
                ]
            },
            {
                fields: [
                    "society_id"
                ]
            },
            {
                fields: [
                    "staff_id"
                ]
            },
            {
                fields: [
                    "shift_id"
                ]
            },
            {
                fields: [
                    "roster_date"
                ]
            },
            {
                fields: [
                    "status"
                ]
            }
        ]
    }
);

module.exports = Roster;