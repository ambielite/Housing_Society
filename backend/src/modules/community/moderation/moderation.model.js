
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityModeration = sequelize.define(
    "CommunityModeration",
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

        reporterId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "reporter_id"
        },

        contentType: {
            type: DataTypes.ENUM(
                "POST",
                "COMMENT"
            ),
            allowNull: false,
            field: "content_type"
        },

        contentId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "content_id"
        },

        reason: {
            type: DataTypes.ENUM(
                "SPAM",
                "ABUSE",
                "HARASSMENT",
                "OFFENSIVE",
                "MISINFORMATION",
                "ILLEGAL_CONTENT",
                "ADVERTISEMENT",
                "DUPLICATE",
                "OTHER"
            ),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        priority: {
            type: DataTypes.ENUM(
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ),
            allowNull: false,
            defaultValue: "MEDIUM"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "UNDER_REVIEW",
                "RESOLVED",
                "DISMISSED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        action: {
            type: DataTypes.ENUM(
                "NONE",
                "HIDE",
                "UNHIDE",
                "DELETE",
                "WARN",
                "DISMISS"
            ),
            allowNull: false,
            defaultValue: "NONE"
        },

        moderatorId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "moderator_id"
        },

        moderationNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "moderation_note"
        },

        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "reviewed_at"
        },

        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "resolved_at"
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
        tableName: "community_moderations",
        timestamps: true,
        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["reporter_id"]
            },
            {
                fields: ["content_type"]
            },
            {
                fields: ["content_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["priority"]
            },
            {
                fields: ["moderator_id"]
            }
        ]
    }
);

module.exports = CommunityModeration;

