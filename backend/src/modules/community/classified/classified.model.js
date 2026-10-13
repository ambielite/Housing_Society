const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityClassified = sequelize.define(
    "CommunityClassified",
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

        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "seller_id"
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        category: {
            type: DataTypes.ENUM(
                "FOR_SALE",
                "FOR_RENT",
                "WANTED",
                "SERVICES",
                "FREE"
            ),
            allowNull: false
        },

        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true
        },

        isNegotiable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "is_negotiable"
        },

        contactName: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "contact_name"
        },

        contactPhone: {
            type: DataTypes.STRING(30),
            allowNull: true,
            field: "contact_phone"
        },

        contactEmail: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "contact_email"
        },

        images: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: []
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "REJECTED",
                "PUBLISHED",
                "SOLD",
                "EXPIRED",
                "REMOVED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        moderationNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "moderation_note"
        },

        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "approved_by"
        },

        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approved_at"
        },

        rejectedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "rejected_by"
        },

        rejectedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "rejected_at"
        },

        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "expires_at"
        },

        soldAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "sold_at"
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
        tableName: "community_classifieds",
        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["seller_id"]
            },
            {
                fields: ["category"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["expires_at"]
            },
            {
                fields: ["created_at"]
            }
        ]
    }
);

module.exports = CommunityClassified;