
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityComment = sequelize.define(
    "CommunityComment",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        postId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "post_id",
            references: {
                model: "community_posts",
                key: "id"
            }
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        parentCommentId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "parent_comment_id",
            references: {
                model: "community_comments",
                key: "id"
            }
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        status: {
            type: DataTypes.ENUM(
                "PUBLISHED",
                "HIDDEN",
                "DELETED"
            ),
            allowNull: false,
            defaultValue: "PUBLISHED"
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
        tableName: "community_comments",
        timestamps: true,
        indexes: [
            {
                fields: ["post_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["parent_comment_id"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = CommunityComment;

