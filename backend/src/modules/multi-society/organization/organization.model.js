const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Organization = sequelize.define(
    "Organization",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        }
    },
    {
        tableName: "organizations",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: ["code"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = Organization;