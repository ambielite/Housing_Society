const AccessAssignment = require('./accessAssignment.model');

const create = async (data, transaction = null) => AccessAssignment.create(data, transaction ? { transaction } : undefined);

const findAll = async (societyId) => AccessAssignment.findAll({
  where: { societyId },
  order: [['created_at', 'DESC']],
});

const findById = async (id, societyId, transaction = null) => AccessAssignment.findOne({
  where: { id, societyId },
  ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
});

const findActiveByUnit = async (unitId, societyId) => AccessAssignment.findOne({
  where: { unitId, societyId, accessStatus: 'ACTIVE' },
  order: [['created_at', 'DESC']],
});

const findActiveByResident = async (residentId, societyId, transaction = null) => AccessAssignment.findAll({
  where: { residentId, societyId, accessStatus: 'ACTIVE' },
  ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
  order: [['created_at', 'DESC']],
});

const findByUnit = async (unitId, societyId) => AccessAssignment.findAll({
  where: { unitId, societyId },
  order: [['created_at', 'DESC']],
});

const findByResident = async (residentId, societyId) => AccessAssignment.findAll({
  where: { residentId, societyId },
  order: [['created_at', 'DESC']],
});

const findByLifecycle = async (lifecycleType, lifecycleId, societyId, transaction = null) => AccessAssignment.findAll({
  where: { lifecycleType, lifecycleId, societyId },
  ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
  order: [['created_at', 'DESC']],
});

const findActive = async (societyId) => AccessAssignment.findAll({
  where: { societyId, accessStatus: 'ACTIVE' },
  order: [['created_at', 'DESC']],
});

const update = async (id, societyId, data) => {
  const assignment = await findById(id, societyId);
  if (!assignment) return null;
  await assignment.update(data);
  return assignment;
};

const deleteById = async (id, societyId) => {
  const assignment = await findById(id, societyId);
  if (!assignment) return null;
  await assignment.destroy();
  return assignment;
};

module.exports = {
  create,
  findAll,
  findById,
  findActiveByUnit,
  findActiveByResident,
  findByUnit,
  findByResident,
  findByLifecycle,
  findActive,
  update,
  deleteById,
};
