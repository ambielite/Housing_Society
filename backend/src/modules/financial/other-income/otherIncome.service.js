const { Op } = require('sequelize');
const sequelize = require('../../../config/database');
const ApiError = require('../../../common/ApiError');
const OtherIncome = require('./otherIncome.model');
const AccountingPeriod = require('../accounting-period/accountingPeriod.model');
const Account = require('../account/account.model');
const Journal = require('../journal/journal.model');
const JournalLine = require('../journal/journalLine.model');
const SocietyBankAccount = require('../society-bank-account/societyBankAccount.model');

const METHODS = ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'];
const receiptNo = () => `OI-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const list = async (societyId, { startDate, endDate } = {}) => {
  if (!societyId) throw new ApiError(400, 'Select a society first');
  const where = { societyId };
  if (startDate || endDate) where.receivedDate = {};
  if (startDate) where.receivedDate[Op.gte] = startDate;
  if (endDate) where.receivedDate[Op.lte] = endDate;
  return OtherIncome.findAll({ where, order: [['receivedDate', 'DESC'], ['id', 'DESC']] });
};

const create = async (payload) => {
  const data = { ...payload };
  data.societyId = String(data.societyId || '').trim();
  data.category = String(data.category || '').trim();
  data.payerName = String(data.payerName || '').trim();
  data.description = String(data.description || '').trim() || null;
  data.referenceNumber = String(data.referenceNumber || '').trim() || null;
  data.paymentMethod = String(data.paymentMethod || '').trim().toUpperCase();
  data.receivedDate = String(data.receivedDate || '').slice(0, 10);
  const amount = Number(data.amount);
  const date = new Date(`${data.receivedDate}T00:00:00Z`);
  if (!data.societyId || !/^\d{4}-\d{2}-\d{2}$/.test(data.receivedDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.receivedDate) throw new ApiError(400, 'Society and a valid received date are required');
  if (!data.category || data.category.length > 80) throw new ApiError(400, 'Enter an income source (up to 80 characters)');
  if (!METHODS.includes(data.paymentMethod)) throw new ApiError(400, 'Choose a valid payment method');
  if (!data.payerName || data.payerName.length > 160) throw new ApiError(400, 'Enter the payer name');
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7) throw new ApiError(400, 'Amount must be greater than zero and have at most two decimal places');

  const transaction = await sequelize.transaction();
  try {
    const period = await AccountingPeriod.findOne({ where: { societyId: data.societyId, status: 'OPEN', startDate: { [Op.lte]: data.receivedDate }, endDate: { [Op.gte]: data.receivedDate } }, transaction });
    if (!period) throw new ApiError(400, 'Create an OPEN accounting period covering the received date before recording income');
    if (data.bankAccountId) {
      const bank = await SocietyBankAccount.findOne({ where: { id: data.bankAccountId, societyId: data.societyId, isActive: true }, transaction });
      if (!bank) throw new ApiError(400, 'Choose an active bank account belonging to this society');
    }
    const cash = data.paymentMethod === 'CASH';
    const [assetAccount, incomeAccount] = await Promise.all([
      Account.findOne({ where: { societyId: data.societyId, accountCode: cash ? '1100' : '1200', isActive: true }, transaction }),
      Account.findOne({ where: { societyId: data.societyId, accountCode: '4200', isActive: true }, transaction }),
    ]);
    if (!assetAccount || !incomeAccount) throw new ApiError(400, 'Finance system accounts are missing. Apply the latest finance migration first.');
    const number = receiptNo();
    const journal = await Journal.create({ societyId: data.societyId, accountingPeriodId: period.id, journalNumber: number, transactionDate: data.receivedDate, referenceType: 'OTHER_INCOME', description: data.description || `${data.category.replaceAll('_', ' ')} received from ${data.payerName}`, status: 'POSTED', totalDebit: amount, totalCredit: amount, postedAt: new Date(), postedBy: payload.createdBy || null }, { transaction });
    await JournalLine.bulkCreate([
      { journalId: journal.id, accountId: assetAccount.id, lineNumber: 1, description: cash ? 'Other income received in cash' : 'Other income received in bank', debitAmount: amount, creditAmount: 0 },
      { journalId: journal.id, accountId: incomeAccount.id, lineNumber: 2, description: data.category.replaceAll('_', ' '), debitAmount: 0, creditAmount: amount },
    ], { transaction });
    const entry = await OtherIncome.create({ societyId: data.societyId, accountingPeriodId: period.id, bankAccountId: data.bankAccountId || null, journalId: journal.id, category: data.category, payerName: data.payerName, description: data.description, amount, receivedDate: data.receivedDate, paymentMethod: data.paymentMethod, referenceNumber: data.referenceNumber, receiptNumber: number, createdBy: payload.createdBy || null }, { transaction });
    await transaction.commit();
    return entry;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { list, create };
