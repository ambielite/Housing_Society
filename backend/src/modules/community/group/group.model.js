
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityGroup = sequelize.define(
    "CommunityGroup",
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

        name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        category: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        visibility: {
            type: DataTypes.ENUM("PUBLIC", "PRIVATE"),
            allowNull: false,
            defaultValue: "PUBLIC"
        },

        rules: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "created_by"
        },

        groupAdminId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "group_admin_id"
        },

        status: {
            type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
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
        tableName: "community_groups",
        timestamps: true,
        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["category"]
            },
            {
                fields: ["status"]
            },
            {
                unique: true,
                fields: ["society_id", "name"]
            }
        ]
    }
);

module.exports = CommunityGroup;

