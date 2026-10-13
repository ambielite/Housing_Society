const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Unit = sequelize.define(
    "Unit",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        floorId: {
            type: DataTypes.UUID,
            allowNull: false,

            references: {
                model: "floors",
                key: "id"
            },

            field: "floor_id"
        },

        unitNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,

            field: "unit_number"
        },

        bhk: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        carpetArea: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,

            field: "carpet_area",

            validate: {
                min: 0
            }
        },

        builtUpArea: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,

            field: "built_up_area",

            validate: {
                min: 0
            }
        },

        propertyType: {
            type: DataTypes.ENUM(
                "RESIDENTIAL",
                "COMMERCIAL"
            ),

            allowNull: false,

            defaultValue: "RESIDENTIAL",

            field: "property_type"
        },

        status: {
            type: DataTypes.ENUM(
                "VACANT",
                "OCCUPIED",
                "UNDER_MOVE_IN",
                "UNDER_MOVE_OUT",
                "INACTIVE"
            ),

            allowNull: false,

            defaultValue: "VACANT"
        },

        areaEffectiveFrom: {
            type: DataTypes.DATEONLY,
            allowNull: true,

            field: "area_effective_from"
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
        tableName: "units",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "floor_id",
                    "unit_number"
                ]
            }
        ]
    }
);

module.exports = Unit;