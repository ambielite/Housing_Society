const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const SocietyEmergencyContact = sequelize.define("SocietyEmergencyContact", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  societyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "society_id",
    references: { model: "societies", key: "id" },
  },
  name: { type: DataTypes.STRING(140), allowNull: false },
  category: { type: DataTypes.STRING(40), allowNull: false },
  phone: { type: DataTypes.STRING(30), allowNull: false },
  alternatePhone: { type: DataTypes.STRING(30), allowNull: true, field: "alternate_phone" },
  email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
  address: { type: DataTypes.STRING(500), allowNull: true },
  operatingHours: { type: DataTypes.STRING(120), allowNull: true, field: "operating_hours" },
  available24x7: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "available_24x7" },
  notes: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
}, {
  tableName: "society_emergency_contacts",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["society_id"] },
    { fields: ["society_id", "category"] },
  ],
});

module.exports = SocietyEmergencyContact;
