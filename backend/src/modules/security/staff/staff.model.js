const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Staff = sequelize.define(
    "Staff",
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

        employeeCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "employee_code"
        },

        firstName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "first_name"
        },

        lastName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "last_name"
        },

        mobileNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: "mobile_number"
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: true
        },

        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "date_of_birth"
        },

        joiningDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "joining_date"
        },

        staffType: {
            type: DataTypes.ENUM(
                "SECURITY_GUARD",
                "SECURITY_SUPERVISOR",
                "MAID",
                "HOUSEKEEPING",
                "MAINTENANCE",
                "ELECTRICIAN",
                "PLUMBER",
                "GARDENER",
                "OTHER"
            ),
            allowNull: false,
            field: "staff_type"
        },

        designation: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        department: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "INACTIVE",
                "ON_LEAVE",
                "SUSPENDED",
                "TERMINATED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        emergencyContactName: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "emergency_contact_name"
        },

        emergencyContactNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "emergency_contact_number"
        },

        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        photoPath: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: "photo_path"
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
        tableName: "staff",
        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "employee_code"
                ]
            },
            {
                fields: [
                    "society_id",
                    "status"
                ]
            },
            {
                fields: [
                    "society_id",
                    "staff_type"
                ]
            }
        ]
    }
);

module.exports = Staff;
