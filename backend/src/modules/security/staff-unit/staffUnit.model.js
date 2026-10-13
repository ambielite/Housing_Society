const { DataTypes } = require("sequelize");

const sequelize =
    require("../../../config/database");

const StaffUnit = sequelize.define(
    "StaffUnit",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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

        unitId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "unit_id",
            references: {
                model: "units",
                key: "id"
            }
        },

        assignmentType: {
            type: DataTypes.ENUM(
                "HOUSEKEEPING",
                "MAINTENANCE",
                "SECURITY",
                "SUPPORT",
                "OTHER"
            ),
            allowNull: false,
            field: "assignment_type"
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

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE",
                "COMPLETED",
                "CANCELLED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        responsibility: {
            type: DataTypes.TEXT,
            allowNull: true
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
        tableName: "staff_unit_assignments",

        timestamps: true,

        indexes: [
            {
                fields: ["staff_id"]
            },
            {
                fields: ["unit_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["assignment_type"]
            },
            {
                unique: true,
                fields: [
                    "staff_id",
                    "unit_id",
                    "start_date"
                ]
            }
        ]
    }
);

module.exports = StaffUnit;