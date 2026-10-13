const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Floor = sequelize.define(
    "Floor",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        towerId: {
            type: DataTypes.UUID,
            allowNull: false,

            references: {
                model: "towers",
                key: "id"
            },

            field: "tower_id"
        },

        floorNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,

            field: "floor_number",

            validate: {
                min: 0
            }
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE"
            ),

            allowNull: false,

            defaultValue: "ACTIVE"
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
        tableName: "floors",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "tower_id",
                    "floor_number"
                ]
            }
        ]
    }
);

module.exports = Floor;