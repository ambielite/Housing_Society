const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Checkpoint = sequelize.define(
    "Checkpoint",
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

        checkpointCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "checkpoint_code"
        },

        checkpointName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "checkpoint_name"
        },

        locationName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "location_name"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
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
            allowNull: false,
            defaultValue: "QR",
            field: "verification_method"
        },

        latitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true
        },

        longitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true
        },

        gpsRadiusMeters: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "gps_radius_meters"
        },

        qrCode: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            field: "qr_code"
        },

        nfcTag: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            field: "nfc_tag"
        },

        sequenceOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            field: "sequence_order"
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
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
        tableName: "security_checkpoints",

        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "checkpoint_code"
                ]
            },
            {
                fields: ["society_id"]
            },
            {
                fields: ["status"]
            },
            {
                fields: ["sequence_order"]
            }
        ]
    }
);

module.exports = Checkpoint;