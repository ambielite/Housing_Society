const {
    DataTypes
} = require("sequelize");

const sequelize = require("../../../config/database");

const Tower = sequelize.define(
    "Tower",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,

            references: {
                model: "societies",
                key: "id"
            },

            field: "society_id"
        },

        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        floorCount: {
            type: DataTypes.INTEGER,
            allowNull: false,

            validate: {
                min: 1
            },

            field: "floor_count"
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
        tableName: "towers",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "name"
                ]
            }
        ]
    }
);

module.exports = Tower;