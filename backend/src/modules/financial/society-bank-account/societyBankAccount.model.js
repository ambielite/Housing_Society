const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const SocietyBankAccount = sequelize.define('SocietyBankAccount', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  societyId: { type: DataTypes.UUID, allowNull: false, field: 'society_id' },
  bankName: { type: DataTypes.STRING(150), allowNull: false, field: 'bank_name' },
  accountHolderName: { type: DataTypes.STRING(255), allowNull: false, field: 'account_holder_name' },
  accountNumber: { type: DataTypes.STRING(34), allowNull: false, field: 'account_number' },
  accountType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'CURRENT',
    field: 'account_type',
  },
  ifsc: { type: DataTypes.STRING(20), allowNull: false },
  branchName: { type: DataTypes.STRING(150), allowNull: true, field: 'branch_name' },
  upiId: { type: DataTypes.STRING(150), allowNull: true, field: 'upi_id' },
  isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_primary' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  remarks: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'society_bank_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SocietyBankAccount;
