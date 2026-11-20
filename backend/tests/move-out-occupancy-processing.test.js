jest.mock('../src/config/database', () => ({
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/move-InOut/move-out/moveOut.repository', () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../src/modules/move-InOut/move-out/moveOut.model', () => ({ findAll: jest.fn() }));
jest.mock('../src/modules/financial/invoice/invoice.repository', () => ({ lockUnitFinancialScope: jest.fn() }));
jest.mock('../src/modules/resident-finance/residentFinance.service', () => ({ calculateMoveOutPendingAmount: jest.fn() }));
jest.mock('../src/modules/move-InOut/access/accessAssignment.model', () => ({ update: jest.fn() }));
jest.mock('../src/modules/move-InOut/lifecycle-audit/lifecycleAudit.model', () => ({ create: jest.fn() }));
jest.mock('../src/modules/move-InOut/billing-responsibility/billingResponsibility.model', () => ({ update: jest.fn(), findOne: jest.fn() }));
jest.mock('../src/modules/residents/resident/resident.model', () => ({ update: jest.fn() }));
jest.mock('../src/modules/move-InOut/occupancy/occupancy.service', () => ({ closeOccupancyForMoveOut: jest.fn() }));
jest.mock('../src/modules/residents/owner-unit/ownerUnit.model', () => ({ update: jest.fn(), create: jest.fn() }));
jest.mock('../src/modules/move-InOut/unitStatus.service', () => ({ recalculateUnitStatus: jest.fn() }));

const sequelize = require('../src/config/database');
const repository = require('../src/modules/move-InOut/move-out/moveOut.repository');
const AccessAssignment = require('../src/modules/move-InOut/access/accessAssignment.model');
const LifecycleAudit = require('../src/modules/move-InOut/lifecycle-audit/lifecycleAudit.model');
const BillingResponsibility = require('../src/modules/move-InOut/billing-responsibility/billingResponsibility.model');
const Resident = require('../src/modules/residents/resident/resident.model');
const occupancyService = require('../src/modules/move-InOut/occupancy/occupancy.service');
const OwnerUnit = require('../src/modules/residents/owner-unit/ownerUnit.model');
const unitStatusService = require('../src/modules/move-InOut/unitStatus.service');
const moveOutService = require('../src/modules/move-InOut/move-out/moveOut.service');
const processor = require('../src/modules/move-InOut/move-out/moveOutEffectiveProcessor.service');
const MoveOut = require('../src/modules/move-InOut/move-out/moveOut.model');
const { processEffectiveMoveOuts } = require('../src/jobs/moveOutEffectiveDate.job');

const transaction = {
  LOCK: { UPDATE: 'UPDATE' },
  finished: undefined,
  commit: jest.fn(async function commit() { this.finished = 'commit'; }),
  rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
};
const moveOutRecord = (overrides = {}) => ({
  id: 'move-out-a', societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a',
  status: 'MOVE_OUT_PASS_ISSUED', effectiveMoveOutDate: '2020-01-01', requestedMoveOutDate: '2019-12-20',
  revertBillingToOwner: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  transaction.finished = undefined;
  sequelize.transaction.mockResolvedValue(transaction);
  repository.findById.mockResolvedValue(moveOutRecord());
  repository.update.mockImplementation(async (_id, values) => ({ ...moveOutRecord(), ...values }));
  AccessAssignment.update.mockResolvedValue([1]);
  Resident.update.mockResolvedValue([1]);
  BillingResponsibility.update.mockResolvedValue([1]);
  BillingResponsibility.findOne.mockResolvedValue(null);
  LifecycleAudit.create.mockResolvedValue({ id: 'audit-a' });
  occupancyService.closeOccupancyForMoveOut.mockResolvedValue({ id: 'occupancy-a', isCurrent: false });
  unitStatusService.recalculateUnitStatus.mockResolvedValue('VACANT');
});

test('manual Move-Out closes the exact tenant Occupancy and commits lifecycle updates atomically', async () => {
  const result = await moveOutService.revokeAccess('move-out-a');

  expect(occupancyService.closeOccupancyForMoveOut).toHaveBeenCalledWith({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a',
    effectiveDate: '2020-01-01', transaction,
  });
  expect(OwnerUnit.update).not.toHaveBeenCalled();
  expect(OwnerUnit.create).not.toHaveBeenCalled();
  expect(AccessAssignment.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
    where: expect.objectContaining({ societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a' }),
    transaction,
  }));
  expect(Resident.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
    where: expect.objectContaining({ societyId: 'society-a' }), transaction,
  }));
  expect(repository.update).toHaveBeenCalledWith('move-out-a', { status: 'ACCESS_REVOKED' }, transaction);
  expect(unitStatusService.recalculateUnitStatus).toHaveBeenCalledWith({
    societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2020-01-01', transaction,
  });
  expect(LifecycleAudit.create).toHaveBeenCalledWith(expect.objectContaining({ newStatus: 'ACCESS_REVOKED' }), { transaction });
  expect(transaction.commit).toHaveBeenCalledTimes(1);
  expect(result.status).toBe('ACCESS_REVOKED');
});

test('manual processing retries are idempotent after access revocation', async () => {
  repository.findById.mockResolvedValue(moveOutRecord({ status: 'ACCESS_REVOKED' }));

  const result = await moveOutService.revokeAccess('move-out-a');

  expect(result.status).toBe('ACCESS_REVOKED');
  expect(occupancyService.closeOccupancyForMoveOut).not.toHaveBeenCalled();
  expect(AccessAssignment.update).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(transaction.commit).toHaveBeenCalledTimes(1);
});

test('occupancy closure failure rolls back before Move-Out status or access changes', async () => {
  occupancyService.closeOccupancyForMoveOut.mockRejectedValue(new Error('occupancy date conflict'));

  await expect(processor.processEffectiveMoveOut('move-out-a')).rejects.toThrow('occupancy date conflict');

  expect(AccessAssignment.update).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(LifecycleAudit.create).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Unit status failure rolls back Occupancy closure and Move-Out processing', async () => {
  unitStatusService.recalculateUnitStatus.mockRejectedValue(new Error('unit update failed'));

  await expect(processor.processEffectiveMoveOut('move-out-a')).rejects.toThrow('unit update failed');

  expect(AccessAssignment.update).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(LifecycleAudit.create).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('scheduled processing uses the same effective processor and persists effective actual date', async () => {
  MoveOut.findAll.mockResolvedValue([moveOutRecord()]);
  repository.findById.mockResolvedValue(moveOutRecord());

  await processEffectiveMoveOuts();

  expect(occupancyService.closeOccupancyForMoveOut).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a', effectiveDate: '2020-01-01', transaction,
  }));
  expect(unitStatusService.recalculateUnitStatus).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2020-01-01', transaction,
  }));
  expect(repository.update).toHaveBeenCalledWith('move-out-a', {
    status: 'ACCESS_REVOKED', actualMoveOutDate: processor.getCurrentDateOnly(),
  }, transaction);
  expect(LifecycleAudit.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'EFFECTIVE_DATE_ACCESS_REVOCATION' }), { transaction });
});

test('OWNER Move-Out does not touch OwnerUnit records', async () => {
  occupancyService.closeOccupancyForMoveOut.mockResolvedValue({ id: 'owner-occupancy', occupancyType: 'OWNER', isCurrent: false });

  await processor.processEffectiveMoveOut('move-out-a');

  expect(occupancyService.closeOccupancyForMoveOut).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a', transaction,
  }));
  expect(OwnerUnit.update).not.toHaveBeenCalled();
  expect(OwnerUnit.create).not.toHaveBeenCalled();
});
