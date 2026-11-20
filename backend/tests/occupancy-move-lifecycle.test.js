jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/config/db', () => ({ pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/modules/move-InOut/occupancy/occupancy.repository', () => ({
  create: jest.fn(),
  findCurrentBySocietyAndUnit: jest.fn(),
  findCurrentTenantByRelationship: jest.fn(),
  findCurrentByRelationship: jest.fn(),
  closeOccupancy: jest.fn(),
}));
jest.mock('../src/modules/societies/unit/unit.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/residents/resident/resident.model', () => ({ findOne: jest.fn() }));

const sequelize = require('../src/config/database');
const repository = require('../src/modules/move-InOut/occupancy/occupancy.repository');
const Resident = require('../src/modules/residents/resident/resident.model');
const occupancyService = require('../src/modules/move-InOut/occupancy/occupancy.service');

const transaction = {
  LOCK: { UPDATE: 'UPDATE' },
  finished: undefined,
  commit: jest.fn(async function commit() { this.finished = 'commit'; }),
  rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
};

beforeEach(() => {
  jest.clearAllMocks();
  transaction.finished = undefined;
  sequelize.transaction.mockResolvedValue(transaction);
  sequelize.query.mockResolvedValue([{ id: 'unit-a' }]);
  Resident.findOne.mockResolvedValue({ id: 'resident-a', societyId: 'society-a' });
  repository.findCurrentBySocietyAndUnit.mockResolvedValue([]);
  repository.findCurrentTenantByRelationship.mockResolvedValue([]);
  repository.findCurrentByRelationship.mockResolvedValue([]);
});

test('Move-In occupancy is created once with activation and billing dates', async () => {
  const created = { id: 'occupancy-a', isCurrent: true };
  repository.create.mockResolvedValue(created);

  const result = await occupancyService.ensureTenantOccupancyForMoveIn({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a', occupancyType: 'TENANT',
  }, '2026-11-19', transaction);

  expect(result).toBe(created);
  expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a',
    occupancyType: 'TENANT', startDate: '2026-11-19', billingStartDate: '2026-11-19',
    endDate: null, billingEndDate: null, isCurrent: true,
  }), transaction);
  expect(repository.findCurrentBySocietyAndUnit).toHaveBeenCalledWith('society-a', 'unit-a', transaction);
  expect(sequelize.query.mock.calls[0][0]).toContain('t.society_id = :societyId');
  expect(Resident.findOne).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'resident-a', societyId: 'society-a' },
  }));
});

test('Move-In reuses the matching current tenant Occupancy without changing its dates', async () => {
  const existing = { id: 'occupancy-existing', residentId: 'resident-a', occupancyType: 'TENANT', startDate: '2025-08-01' };
  repository.findCurrentBySocietyAndUnit.mockResolvedValue([existing]);

  const result = await occupancyService.ensureTenantOccupancyForMoveIn({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a', occupancyType: 'TENANT',
  }, '2026-11-19', transaction);

  expect(result).toBe(existing);
  expect(repository.create).not.toHaveBeenCalled();
});

test('Move-In rejects a different active Occupancy instead of creating a duplicate', async () => {
  repository.findCurrentBySocietyAndUnit.mockResolvedValue([{
    id: 'occupancy-other', residentId: 'resident-b', occupancyType: 'TENANT',
  }]);

  await expect(occupancyService.ensureTenantOccupancyForMoveIn({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a', occupancyType: 'TENANT',
  }, '2026-11-19', transaction)).rejects.toThrow('Unit already has a conflicting current occupancy');
  expect(repository.create).not.toHaveBeenCalled();
});

test('Owner Move-In creates one OWNER Occupancy after validating its active ownership separately', async () => {
  const created = { id: 'owner-occupancy-a', occupancyType: 'OWNER', isCurrent: true };
  repository.create.mockResolvedValue(created);

  await expect(occupancyService.ensureOwnerOccupancyForMoveIn({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'owner-a', occupancyType: 'OWNER',
  }, '2026-11-19', transaction)).resolves.toBe(created);

  expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'owner-a', occupancyType: 'OWNER',
    startDate: '2026-11-19', billingStartDate: '2026-11-19', isCurrent: true,
  }), transaction);
});

test('Owner Move-In reuses the matching OWNER Occupancy and rejects a conflicting current Occupancy', async () => {
  const existing = { id: 'owner-occupancy-existing', residentId: 'owner-a', occupancyType: 'OWNER', startDate: '2025-01-01', endDate: null };
  repository.findCurrentBySocietyAndUnit.mockResolvedValue([existing]);
  await expect(occupancyService.ensureOwnerOccupancyForMoveIn({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'owner-a', occupancyType: 'OWNER',
  }, '2026-11-19', transaction)).resolves.toBe(existing);
  expect(repository.create).not.toHaveBeenCalled();

  repository.findCurrentBySocietyAndUnit.mockResolvedValue([{ ...existing, residentId: 'other-owner' }]);
  await expect(occupancyService.ensureOwnerOccupancyForMoveIn({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'owner-a', occupancyType: 'OWNER',
  }, '2026-11-19', transaction)).rejects.toThrow('Unit already has a conflicting current occupancy');
});

test('Move-Out closes the matching current TENANT Occupancy with effective end dates', async () => {
  const current = { id: 'tenant-occupancy', startDate: '2025-01-01' };
  repository.findCurrentByRelationship.mockResolvedValue([current]);
  repository.closeOccupancy.mockResolvedValue({ ...current, isCurrent: false });

  await occupancyService.closeOccupancyForMoveOut({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a',
    effectiveDate: '2026-11-10', transaction,
  });

  expect(repository.findCurrentByRelationship).toHaveBeenCalledWith('society-a', 'unit-a', 'resident-a', transaction);
  expect(repository.closeOccupancy).toHaveBeenCalledWith('tenant-occupancy', '2026-11-10', transaction);
});

test('Move-Out closes the matching owner or tenant Occupancy without changing ownership and rejects duplicates', async () => {
  const ownerOccupancy = { id: 'owner-occupancy', startDate: '2025-01-01', occupancyType: 'OWNER' };
  repository.findCurrentByRelationship.mockResolvedValue([ownerOccupancy]);
  repository.closeOccupancy.mockResolvedValue({ ...ownerOccupancy, isCurrent: false });
  await expect(occupancyService.closeOccupancyForMoveOut({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'owner-a',
    effectiveDate: '2026-11-10', transaction,
  })).resolves.toEqual(expect.objectContaining({ id: 'owner-occupancy', isCurrent: false }));
  expect(repository.findCurrentByRelationship).toHaveBeenCalledWith('society-a', 'unit-a', 'owner-a', transaction);
  expect(repository.closeOccupancy).toHaveBeenCalledWith('owner-occupancy', '2026-11-10', transaction);

  repository.findCurrentByRelationship.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);
  await expect(occupancyService.closeOccupancyForMoveOut({
    societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a',
    effectiveDate: '2026-11-10', transaction,
  })).rejects.toThrow('Move-Out matches multiple current occupancies');
  expect(repository.closeOccupancy).toHaveBeenCalledTimes(1);
});
