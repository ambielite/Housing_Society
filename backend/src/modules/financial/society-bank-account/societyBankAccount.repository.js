const SocietyBankAccount = require('./societyBankAccount.model');

const findAll = (societyId, transaction) => SocietyBankAccount.findAll({
  where: { societyId },
  order: [['isPrimary', 'DESC'], ['isActive', 'DESC'], ['bankName', 'ASC']],
  ...(transaction ? { transaction } : {}),
});

const findById = (id, societyId, transaction) => SocietyBankAccount.findOne({
  where: { id, societyId },
  ...(transaction ? { transaction } : {}),
});

const countActive = (societyId, transaction) => SocietyBankAccount.count({
  where: { societyId, isActive: true },
  ...(transaction ? { transaction } : {}),
});

const clearPrimary = (societyId, exceptId, transaction) => SocietyBankAccount.update(
  { isPrimary: false },
  { where: { societyId, isPrimary: true, ...(exceptId ? { id: { [require('sequelize').Op.ne]: exceptId } } : {}) }, transaction },
);

const create = (data, transaction) => SocietyBankAccount.create(data, { transaction });

const update = (account, data, transaction) => account.update(data, { transaction });

module.exports = { findAll, findById, countActive, clearPrimary, create, update };
