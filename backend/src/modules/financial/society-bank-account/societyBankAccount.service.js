const sequelize = require('../../../config/database');
const ApiError = require('../../../common/ApiError');
const repository = require('./societyBankAccount.repository');

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_TYPES = ['SAVINGS', 'CURRENT', 'CASH_CREDIT', 'OVERDRAFT'];

const normalize = (data, { creating = false } = {}) => {
  const result = { ...data };
  if (result.bankName !== undefined) result.bankName = String(result.bankName || '').trim();
  if (result.accountHolderName !== undefined) result.accountHolderName = String(result.accountHolderName || '').trim();
  if (result.ifsc !== undefined) result.ifsc = String(result.ifsc || '').trim().toUpperCase();
  if (result.branchName !== undefined) result.branchName = String(result.branchName || '').trim() || null;
  if (result.upiId !== undefined) result.upiId = String(result.upiId || '').trim() || null;
  if (result.remarks !== undefined) result.remarks = String(result.remarks || '').trim() || null;
  if (result.accountNumber !== undefined) result.accountNumber = String(result.accountNumber || '').replace(/[\s-]/g, '');

  if (!result.societyId) throw new ApiError(400, 'Society is required');
  if (creating || result.bankName !== undefined) {
    if (!result.bankName || result.bankName.length > 150) throw new ApiError(400, 'Enter a bank name (up to 150 characters)');
  }
  if (creating || result.accountHolderName !== undefined) {
    if (!result.accountHolderName || result.accountHolderName.length > 255) throw new ApiError(400, 'Enter the account holder name');
  }
  if (creating || result.accountNumber) {
    if (!/^\d{6,18}$/.test(result.accountNumber || '')) throw new ApiError(400, 'Account number must contain 6 to 18 digits');
  } else {
    delete result.accountNumber;
  }
  if (creating || result.ifsc !== undefined) {
    if (!IFSC_PATTERN.test(result.ifsc || '')) throw new ApiError(400, 'Enter a valid IFSC code, for example HDFC0001234');
  }
  if (result.accountType !== undefined && !ACCOUNT_TYPES.includes(result.accountType)) {
    throw new ApiError(400, 'Choose a valid account type');
  }
  if (result.isPrimary !== undefined && typeof result.isPrimary !== 'boolean') {
    throw new ApiError(400, 'isPrimary must be true or false');
  }
  if (result.upiId && result.upiId.length > 150) throw new ApiError(400, 'UPI ID must be 150 characters or fewer');
  return result;
};

const maskAccountNumber = (accountNumber) => {
  const digits = String(accountNumber || '');
  return digits ? `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}` : '';
};

const serialize = (account) => {
  const value = account.toJSON();
  return { ...value, accountNumberMasked: maskAccountNumber(value.accountNumber), accountNumber: undefined };
};

const list = async (societyId) => {
  if (!societyId) throw new ApiError(400, 'Select a society first');
  return (await repository.findAll(societyId)).map(serialize);
};

const create = async (payload) => {
  const data = normalize(payload, { creating: true });
  const transaction = await sequelize.transaction();
  try {
    const hasActive = await repository.countActive(data.societyId, transaction);
    const isPrimary = Boolean(data.isPrimary) || hasActive === 0;
    if (isPrimary) await repository.clearPrimary(data.societyId, null, transaction);
    const account = await repository.create({ ...data, isPrimary, isActive: true }, transaction);
    await transaction.commit();
    return serialize(account);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const update = async (id, societyId, payload) => {
  const transaction = await sequelize.transaction();
  try {
    const account = await repository.findById(id, societyId, transaction);
    if (!account) throw new ApiError(404, 'Society bank account not found');
    const data = normalize({ ...payload, societyId });
    const makePrimary = Boolean(data.isPrimary);
    if (makePrimary) await repository.clearPrimary(societyId, id, transaction);
    const updated = await repository.update(account, { ...data, ...(makePrimary ? { isPrimary: true } : {}) }, transaction);
    await transaction.commit();
    return serialize(updated);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deactivate = async (id, societyId) => {
  const transaction = await sequelize.transaction();
  try {
    const account = await repository.findById(id, societyId, transaction);
    if (!account) throw new ApiError(404, 'Society bank account not found');
    await repository.update(account, { isActive: false, isPrimary: false }, transaction);
    if (account.isPrimary) {
      const remaining = (await repository.findAll(societyId, transaction)).find((item) => item.id !== id && item.isActive);
      if (remaining) await repository.update(remaining, { isPrimary: true }, transaction);
    }
    await transaction.commit();
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { list, create, update, deactivate };
