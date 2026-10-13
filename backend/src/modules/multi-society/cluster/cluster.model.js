const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Cluster = sequelize.define(
    "Cluster",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        organizationId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "organization_id",
            references: {
                model: "organizations",
                key: "id"
            }
        },

        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        code: {
            type: DataTypes.STRING(50),
            allowNull: false
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
        tableName: "clusters",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "organization_id",
                    "code"
                ]
            },
            {
                fields: ["organization_id"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = Cluster;