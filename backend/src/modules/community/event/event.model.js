
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityEvent = sequelize.define(
    "CommunityEvent",
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

        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "created_by"
        },

        approvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "approved_by"
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
                "SOCIAL",
                "SPORTS",
                "CULTURAL",
                "EDUCATIONAL",
                "FESTIVAL",
                "MEETING",
                "WORKSHOP",
                "OTHER"
            ),
            allowNull: false
        },

        venue: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        startAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "start_at"
        },

        endAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "end_at"
        },

        registrationStartAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "registration_start_at"
        },

        registrationEndAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "registration_end_at"
        },

        capacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1
            }
        },

        isFree: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_free"
        },

        ticketPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "ticket_price"
        },

        imageUrl: {
            type: DataTypes.STRING(1000),
            allowNull: true,
            field: "image_url"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "PUBLISHED",
                "CANCELLED",
                "COMPLETED",
                "EXPIRED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approved_at"
        },

        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "published_at"
        },

        cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "cancelled_at"
        },

        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "completed_at"
        },

        cancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "cancellation_reason"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
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
        tableName: "community_events",
        timestamps: true,

        indexes: [
            {
                fields: ["society_id"]
            },
            {
                fields: ["created_by"]
            },
            {
                fields: ["category"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["start_at"]
            },
            {
                fields: ["registration_start_at"]
            },
            {
                fields: ["registration_end_at"]
            }
        ]
    }
);

module.exports = CommunityEvent;

