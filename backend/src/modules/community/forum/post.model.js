
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityPost = sequelize.define(
    "CommunityPost",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        forumId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "forum_id",
            references: {
                model: "community_forums",
                key: "id"
            }
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "PUBLISHED",
                "HIDDEN",
                "DELETED"
            ),
            allowNull: false,
            defaultValue: "PUBLISHED"
        },

        isPinned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_pinned"
        },

        isLocked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_locked"
        },

        viewCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "view_count"
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
        tableName: "community_posts",
        timestamps: true,
        indexes: [
            {
                fields: ["forum_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["is_pinned"]
            }
        ]
    }
);

module.exports = CommunityPost;

