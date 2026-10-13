const { DataTypes } = require("sequelize");

const sequelize =
    require("../../../config/database");

const Shift = sequelize.define(
    "Shift",
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

        shiftCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "shift_code"
        },

        shiftName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "shift_name"
        },

        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
            field: "start_time"
        },

        endTime: {
            type: DataTypes.TIME,
            allowNull: false,
            field: "end_time"
        },

        shiftType: {
            type: DataTypes.ENUM(
                "MORNING",
                "AFTERNOON",
                "EVENING",
                "NIGHT",
                "GENERAL",
                "OTHER"
            ),
            allowNull: false,
            defaultValue: "GENERAL",
            field: "shift_type"
        },

        breakMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "break_minutes",
            validate: {
                min: 0
            }
        },

        graceMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "grace_minutes",
            validate: {
                min: 0
            }
        },

        isOvernight: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_overnight"
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        description: {
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
        tableName: "shifts",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "shift_code"
                ]
            },
            {
                fields: [
                    "society_id"
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

module.exports = Shift;