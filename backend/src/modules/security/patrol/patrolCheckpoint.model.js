const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const PatrolCheckpoint = sequelize.define(
    "PatrolCheckpoint",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        patrolId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "patrol_id",
            references: {
                model: "security_patrols",
                key: "id"
            }
        },

        checkpointId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "checkpoint_id",
            references: {
                model: "security_checkpoints",
                key: "id"
            }
        },

        sequenceOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "sequence_order"
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "VERIFIED",
                "MISSED"
            ),
            allowNull: false,
            defaultValue: "PENDING"
        },

        verificationMethod: {
            type: DataTypes.ENUM(
                "QR",
                "NFC",
                "GPS",
                "QR_NFC",
                "QR_GPS",
                "NFC_GPS",
                "QR_NFC_GPS"
            ),
            allowNull: true,
            field: "verification_method"
        },

        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "verified_at"
        },

        verifiedLatitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true,
            field: "verified_latitude"
        },

        verifiedLongitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true,
            field: "verified_longitude"
        },

        verificationReference: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: "verification_reference"
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
        tableName: "patrol_checkpoints",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "patrol_id",
                    "checkpoint_id"
                ]
            },
            {
                fields: ["patrol_id"]
            },
            {
                fields: ["checkpoint_id"]
            },
            {
                fields: ["status"]
            }
        ]
    }
);

module.exports = PatrolCheckpoint;