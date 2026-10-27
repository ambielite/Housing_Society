const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

module.exports = sequelize.define('OtherIncome', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  societyId: { type: DataTypes.UUID, allowNull: false, field: 'society_id' },
  accountingPeriodId: { type: DataTypes.UUID, allowNull: false, field: 'accounting_period_id' },
  bankAccountId: { type: DataTypes.UUID, allowNull: true, field: 'bank_account_id' },
  journalId: { type: DataTypes.UUID, allowNull: false, field: 'journal_id' },
  category: { type: DataTypes.STRING(80), allowNull: false },
  payerName: { type: DataTypes.STRING(160), allowNull: false, field: 'payer_name' },
  description: { type: DataTypes.TEXT, allowNull: true },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  receivedDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'received_date' },
  paymentMethod: { type: DataTypes.STRING(20), allowNull: false, field: 'payment_method' },
  referenceNumber: { type: DataTypes.STRING(120), allowNull: true, field: 'reference_number' },
  receiptNumber: { type: DataTypes.STRING(40), allowNull: false, field: 'receipt_number' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'other_income_entries', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
