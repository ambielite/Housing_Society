const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const SocietyCommitteeMember = sequelize.define("SocietyCommitteeMember", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  societyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "society_id",
    references: { model: "societies", key: "id" },
  },
  memberName: { type: DataTypes.STRING(140), allowNull: false, field: "member_name" },
  designation: { type: DataTypes.STRING(40), allowNull: false },
  unitNumber: { type: DataTypes.STRING(40), allowNull: true, field: "unit_number" },
  phone: { type: DataTypes.STRING(30), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
  profilePictureUrl: { type: DataTypes.STRING(500), allowNull: true, field: "profile_picture_url" },
  termStart: { type: DataTypes.DATEONLY, allowNull: true, field: "term_start" },
  termEnd: { type: DataTypes.DATEONLY, allowNull: true, field: "term_end" },
  notes: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
}, {
  tableName: "society_management_committee_members",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ["society_id"] },
    { fields: ["society_id", "designation"] },
    { fields: ["society_id", "is_active"] },
  ],
});

module.exports = SocietyCommitteeMember;
