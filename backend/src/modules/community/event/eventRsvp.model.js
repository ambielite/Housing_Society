
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CommunityEventRsvp = sequelize.define(
    "CommunityEventRsvp",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "event_id",
            references: {
                model: "community_events",
                key: "id"
            }
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

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "user_id"
        },

        guestCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: "guest_count",
            validate: {
                min: 0
            }
        },

        totalTickets: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            field: "total_tickets",
            validate: {
                min: 1
            }
        },

        ticketPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "ticket_price"
        },

        totalAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: "total_amount"
        },

        paymentStatus: {
            type: DataTypes.ENUM(
                "NOT_REQUIRED",
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED"
            ),
            allowNull: false,
            defaultValue: "NOT_REQUIRED",
            field: "payment_status"
        },

        paymentReference: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "payment_reference"
        },

        status: {
            type: DataTypes.ENUM(
                "REGISTERED",
                "WAITLISTED",
                "CANCELLED",
                "CHECKED_IN",
                "NO_SHOW"
            ),
            allowNull: false,
            defaultValue: "REGISTERED"
        },

        registeredAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "registered_at"
        },

        cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "cancelled_at"
        },

        checkedInAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "checked_in_at"
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
        tableName: "community_event_rsvps",
        timestamps: true,

        indexes: [
            {
                fields: ["event_id"]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["user_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["payment_status"]
            },

            {
                unique: true,
                fields: ["event_id", "user_id"]
            }
        ]
    }
);

module.exports = CommunityEventRsvp;

