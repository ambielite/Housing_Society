jest.mock('../src/config/database', () => ({
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/move-InOut/move-in/moveIn.repository', () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../src/modules/move-InOut/access/accessAssignment.service', () => ({
  getAccessByLifecycle: jest.fn(),
  createAccessAssignment: jest.fn(),
}));
jest.mock('../src/modules/move-InOut/occupancy/occupancy.service', () => ({
  ensureTenantOccupancyForMoveIn: jest.fn(),
  ensureOwnerOccupancyForMoveIn: jest.fn(),
}));
jest.mock('../src/modules/residents/owner-unit/ownerUnit.service', () => ({
  ensureExistingOwnerUnitForMoveIn: jest.fn(),
}));
jest.mock('../src/modules/move-InOut/unitStatus.service', () => ({ recalculateUnitStatus: jest.fn() }));

const sequelize = require('../src/config/database');
const repository = require('../src/modules/move-InOut/move-in/moveIn.repository');
const accessService = require('../src/modules/move-InOut/access/accessAssignment.service');
const occupancyService = require('../src/modules/move-InOut/occupancy/occupancy.service');
const ownerUnitService = require('../src/modules/residents/owner-unit/ownerUnit.service');
const unitStatusService = require('../src/modules/move-InOut/unitStatus.service');
const moveInService = require('../src/modules/move-InOut/move-in/moveIn.service');

const transaction = {
  LOCK: { UPDATE: 'UPDATE' },
  finished: undefined,
  commit: jest.fn(async function commit() { this.finished = 'commit'; }),
  rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
};

const moveInRecord = (overrides = {}) => ({
  id: 'move-in-a', societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a',
  occupancyType: 'TENANT', status: 'LEDGER_CREATED', actualMoveInDate: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  transaction.finished = undefined;
  sequelize.transaction.mockResolvedValue(transaction);
  repository.findById.mockResolvedValue(moveInRecord());
  repository.update.mockImplementation(async (_id, values) => ({ ...moveInRecord(), ...values }));
  accessService.getAccessByLifecycle.mockResolvedValue([]);
  ownerUnitService.ensureExistingOwnerUnitForMoveIn.mockResolvedValue({ id: 'owner-unit-a' });
  occupancyService.ensureOwnerOccupancyForMoveIn.mockResolvedValue({ id: 'owner-occupancy-a' });
  unitStatusService.recalculateUnitStatus.mockResolvedValue('OCCUPIED');
});

test('approved tenant activation creates one Occupancy and commits it with access/status', async () => {
  occupancyService.ensureTenantOccupancyForMoveIn.mockResolvedValue({ id: 'occupancy-a' });
  accessService.createAccessAssignment.mockResolvedValue({ id: 'access-a' });

  const result = await moveInService.activateAccess('move-in-a');

  expect(occupancyService.ensureTenantOccupancyForMoveIn).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'move-in-a', occupancyType: 'TENANT' }),
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    transaction,
  );
  expect(ownerUnitService.ensureExistingOwnerUnitForMoveIn).not.toHaveBeenCalled();
  expect(accessService.createAccessAssignment).toHaveBeenCalledWith(
    expect.objectContaining({ lifecycleType: 'MOVE_IN', lifecycleId: 'move-in-a', accessType: 'TENANT' }),
    transaction,
  );
  expect(repository.update).toHaveBeenCalledWith('move-in-a', expect.objectContaining({ status: 'ACCESS_ACTIVATED' }), transaction);
  expect(unitStatusService.recalculateUnitStatus).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', unitId: 'unit-a', transaction,
  }));
  expect(transaction.commit).toHaveBeenCalledTimes(1);
  expect(result.status).toBe('ACCESS_ACTIVATED');
});

test('repeated activation returns existing completed activation without creating another Occupancy', async () => {
  repository.findById.mockResolvedValue(moveInRecord({ status: 'ACCESS_ACTIVATED', actualMoveInDate: '2026-11-19' }));

  const result = await moveInService.activateAccess('move-in-a');

  expect(result.status).toBe('ACCESS_ACTIVATED');
  expect(occupancyService.ensureTenantOccupancyForMoveIn).not.toHaveBeenCalled();
  expect(accessService.createAccessAssignment).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(transaction.commit).toHaveBeenCalledTimes(1);
});

test('unapproved/incomplete Move-In cannot create an Occupancy', async () => {
  repository.findById.mockResolvedValue(moveInRecord({ status: 'UNDER_VERIFICATION' }));

  await expect(moveInService.activateAccess('move-in-a')).rejects.toThrow('Access can only be activated after ledger creation');

  expect(occupancyService.ensureTenantOccupancyForMoveIn).not.toHaveBeenCalled();
  expect(accessService.createAccessAssignment).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('OWNER Move-In validates legal ownership and creates/reuses physical Occupancy', async () => {
  repository.findById.mockResolvedValue(moveInRecord({ occupancyType: 'OWNER' }));
  accessService.createAccessAssignment.mockResolvedValue({ id: 'access-a' });

  await moveInService.activateAccess('move-in-a');

  expect(occupancyService.ensureTenantOccupancyForMoveIn).not.toHaveBeenCalled();
  expect(ownerUnitService.ensureExistingOwnerUnitForMoveIn).toHaveBeenCalledWith(
    expect.objectContaining({ occupancyType: 'OWNER' }),
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    transaction,
  );
  expect(occupancyService.ensureOwnerOccupancyForMoveIn).toHaveBeenCalledWith(
    expect.objectContaining({ occupancyType: 'OWNER' }),
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    transaction,
  );
  expect(accessService.createAccessAssignment).toHaveBeenCalledWith(expect.objectContaining({ accessType: 'OWNER' }), transaction);
});

test('OWNER Move-In without validated ownership rolls back before access activation', async () => {
  repository.findById.mockResolvedValue(moveInRecord({ occupancyType: 'OWNER' }));
  ownerUnitService.ensureExistingOwnerUnitForMoveIn.mockRejectedValue(new Error('ownership required'));

  await expect(moveInService.activateAccess('move-in-a')).rejects.toThrow('ownership required');

  expect(accessService.createAccessAssignment).not.toHaveBeenCalled();
  expect(occupancyService.ensureOwnerOccupancyForMoveIn).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('OWNER Occupancy failure rolls back activation without changing ownership or access', async () => {
  repository.findById.mockResolvedValue(moveInRecord({ occupancyType: 'OWNER' }));
  occupancyService.ensureOwnerOccupancyForMoveIn.mockRejectedValue(new Error('occupancy conflict'));

  await expect(moveInService.activateAccess('move-in-a')).rejects.toThrow('occupancy conflict');

  expect(accessService.createAccessAssignment).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Occupancy activation failure rolls back without activating access or changing Move-In status', async () => {
  occupancyService.ensureTenantOccupancyForMoveIn.mockRejectedValue(new Error('society mismatch'));

  await expect(moveInService.activateAccess('move-in-a')).rejects.toThrow('society mismatch');

  expect(accessService.createAccessAssignment).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Unit status recalculation failure rolls back Move-In activation atomically', async () => {
  occupancyService.ensureTenantOccupancyForMoveIn.mockResolvedValue({ id: 'occupancy-a' });
  unitStatusService.recalculateUnitStatus.mockRejectedValue(new Error('unit update failed'));

  await expect(moveInService.activateAccess('move-in-a')).rejects.toThrow('unit update failed');

  expect(accessService.createAccessAssignment).not.toHaveBeenCalled();
  expect(repository.update).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});
