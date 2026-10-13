const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const MultiSocietyAccess = sequelize.define(
    "MultiSocietyAccess",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        organizationId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "organization_id",
            references: {
                model: "organizations",
                key: "id"
            }
        },

        clusterId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "cluster_id",
            references: {
                model: "clusters",
                key: "id"
            }
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "society_id",
            references: {
                model: "societies",
                key: "id"
            }
        },

        accessLevel: {
            type: DataTypes.ENUM(
                "ORGANIZATION",
                "CLUSTER",
                "SOCIETY"
            ),
            allowNull: false,
            field: "access_level"
        },

        role: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "start_date"
        },

        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "end_date"
        },

        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "created_by"
        }
    },
    {
        tableName: "multi_society_access",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                fields: ["user_id"]
            },
            {
                fields: ["organization_id"]
            },
            {
                fields: ["cluster_id"]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["access_level"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = MultiSocietyAccess;