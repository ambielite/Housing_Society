const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Society = sequelize.define(
    "Society",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isEmail: true }
        },

        phone: {
            type: DataTypes.STRING(30),
            allowNull: true
        },

        reraNumber: {
            type: DataTypes.STRING(100),
            field: "rera_number"
        },

        pan: {
            type: DataTypes.STRING(20)
        },

        gstin: {
            type: DataTypes.STRING(20)
        },

        address: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        structuralArea: {
            type: DataTypes.DECIMAL,
            field: "structural_area"
        },

        currency: {
            type: DataTypes.STRING(10),
            defaultValue: "INR"
        },

        timezone: {
            type: DataTypes.STRING(100),
            defaultValue: "Asia/Kolkata"
        },

        taxConfiguration: {
            type: DataTypes.JSONB,
            field: "tax_configuration"
        },

        organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: "organization_id",
    references: {
        model: "organizations",
        key: "id"
    }
},

clusterId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: "cluster_id",
    references: {
        model: "clusters",
        key: "id"
    }
},
    },
    {
        tableName: "societies",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

module.exports = Society;
