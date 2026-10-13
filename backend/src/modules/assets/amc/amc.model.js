const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const AMC = sequelize.define(
    "AMC",
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

        amcNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "amc_number"
        },

        vendorId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "vendor_id",
            references: {
                model: "vendors",
                key: "id"
            }
        },

        assetId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "asset_id",
            references: {
                model: "assets",
                key: "id"
            }
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "start_date"
        },

        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "end_date"
        },

        contractCost: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: false,
            field: "contract_cost",
            validate: {
                min: 0
            }
        },

        sla: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        responseTime: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "response_time",
            comment: "Response time in hours"
        },

        resolutionTime: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "resolution_time",
            comment: "Resolution time in hours"
        },

        renewalRequired: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "renewal_required"
        },

        renewalDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "renewal_date"
        },

        parentAmcId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "parent_amc_id"
        },

        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "ACTIVE",
                "EXPIRING_SOON",
                "RENEWAL_INITIATED",
                "RENEWED",
                "EXPIRED",
                "TERMINATED"
            ),
            allowNull: false,
            defaultValue: "DRAFT"
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "amcs",

        timestamps: true,

        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "amc_number"
                ]
            },
            {
                fields: [
                    "society_id"
                ]
            },
            {
                fields: [
                    "vendor_id"
                ]
            },
            {
                fields: [
                    "asset_id"
                ]
            },
            {
                fields: [
                    "start_date"
                ]
            },
            {
                fields: [
                    "end_date"
                ]
            },
            {
                fields: [
                    "status"
                ]
            }
        ]
    }
);

module.exports = AMC;