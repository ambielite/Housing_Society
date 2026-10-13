
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityGroupMember = sequelize.define(
    "CommunityGroupMember",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "group_id",
            references: {
                model: "community_groups",
                key: "id"
            }
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        role: {
            type: DataTypes.ENUM(
                "ADMIN",
                "MODERATOR",
                "MEMBER"
            ),
            allowNull: false,
            defaultValue: "MEMBER"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "ACTIVE",
                "REMOVED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        joinedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "joined_at"
        },

        removedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "removed_at"
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
        tableName: "community_group_members",
        timestamps: true,
        indexes: [
            {
                fields: ["group_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["status"]
            },
            {
                unique: true,
                fields: ["group_id", "user_id"]
            }
        ]
    }
);

module.exports = CommunityGroupMember;

