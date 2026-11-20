const { QueryTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const Resident = require('../../residents/resident/resident.model');
const repository = require('./accessAssignment.repository');

const requireSociety = (societyId) => {
  if (!societyId) throw new Error('Society ID is required');
  return societyId;
};

const validateResidentAndUnit = async ({ societyId, residentId, unitId, transaction = null }) => {
  requireSociety(societyId);
  const resident = await Resident.findOne({
    where: { id: residentId, societyId },
    ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!resident) throw new Error('Resident does not belong to the selected society');

  const [unit] = await sequelize.query(
    `SELECT u.id
       FROM units u
       JOIN floors f ON f.id = u.floor_id
       JOIN towers t ON t.id = f.tower_id
      WHERE u.id = :unitId AND t.society_id = :societyId
      LIMIT 1
      ${transaction ? 'FOR UPDATE OF u' : ''}`,
    {
      replacements: { unitId, societyId },
      type: QueryTypes.SELECT,
      ...(transaction ? { transaction } : {}),
    },
  );
  if (!unit) throw new Error('Unit does not belong to the selected society');
};

const createAccessAssignment = async (data, transaction = null) => {
  await validateResidentAndUnit({ ...data, transaction });
  const existingAccess = await repository.findActiveByResident(data.residentId, data.societyId, transaction);
  if (existingAccess.some((access) => access.unitId === data.unitId)) {
    throw new Error('Resident already has active access for this unit');
  }

  return repository.create({
    societyId: data.societyId,
    unitId: data.unitId,
    residentId: data.residentId,
    lifecycleType: data.lifecycleType,
    lifecycleId: data.lifecycleId,
    accessType: data.accessType,
    accessStatus: 'ACTIVE',
    activatedAt: data.activatedAt || new Date(),
    activatedBy: data.activatedBy || null,
    revokedAt: null,
    revokedBy: null,
    remarks: data.remarks || null,
  }, transaction);
};

const getAccessAssignments = async (societyId) => repository.findAll(requireSociety(societyId));
const getAccessAssignment = async (id, societyId) => repository.findById(id, requireSociety(societyId));
const getActiveAccess = async (societyId) => repository.findActive(requireSociety(societyId));
const getActiveAccessByUnit = async (unitId, societyId) => repository.findActiveByUnit(unitId, requireSociety(societyId));
const getActiveAccessByResident = async (residentId, societyId) => repository.findActiveByResident(residentId, requireSociety(societyId));
const getAccessHistoryByUnit = async (unitId, societyId) => repository.findByUnit(unitId, requireSociety(societyId));
const getAccessHistoryByResident = async (residentId, societyId) => repository.findByResident(residentId, requireSociety(societyId));

const getAccessByLifecycle = async (lifecycleType, lifecycleId, societyId, transaction = null) => (
  repository.findByLifecycle(lifecycleType, lifecycleId, requireSociety(societyId), transaction)
);

const findAssignment = async (id, societyId) => {
  const assignment = await repository.findById(id, requireSociety(societyId));
  if (!assignment) throw new Error('Access assignment not found');
  return assignment;
};

const updateAssignment = async (assignment, societyId, values) => repository.update(assignment.id, societyId, values);

const revokeAccess = async (id, societyId, revokedBy, remarks) => {
  const assignment = await findAssignment(id, societyId);
  if (assignment.accessStatus === 'REVOKED') throw new Error('Access is already revoked');
  return updateAssignment(assignment, societyId, {
    accessStatus: 'REVOKED', revokedAt: new Date(), revokedBy,
    remarks: remarks || 'Access revoked',
  });
};

const suspendAccess = async (id, societyId, remarks) => {
  const assignment = await findAssignment(id, societyId);
  if (assignment.accessStatus !== 'ACTIVE') throw new Error('Only active access can be suspended');
  return updateAssignment(assignment, societyId, {
    accessStatus: 'SUSPENDED', remarks: remarks || 'Access suspended',
  });
};

const reactivateAccess = async (id, societyId, activatedBy, remarks) => {
  const assignment = await findAssignment(id, societyId);
  if (assignment.accessStatus === 'ACTIVE') throw new Error('Access is already active');
  return updateAssignment(assignment, societyId, {
    accessStatus: 'ACTIVE', activatedAt: new Date(), activatedBy,
    revokedAt: null, revokedBy: null, remarks: remarks || 'Access reactivated',
  });
};

const deleteAccessAssignment = async (id, societyId) => {
  const assignment = await repository.deleteById(id, requireSociety(societyId));
  if (!assignment) throw new Error('Access assignment not found');
  return assignment;
};

module.exports = {
  createAccessAssignment,
  getAccessAssignments,
  getAccessAssignment,
  getActiveAccess,
  getActiveAccessByUnit,
  getActiveAccessByResident,
  getAccessHistoryByUnit,
  getAccessHistoryByResident,
  getAccessByLifecycle,
  revokeAccess,
  suspendAccess,
  reactivateAccess,
  deleteAccessAssignment,
};
