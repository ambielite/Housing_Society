jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/residents/owner-unit/ownerUnit.repository', () => ({
  findEffectiveActiveRelation: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../src/modules/residents/resident/resident.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/societies/society/society.model', () => ({}));
jest.mock('../src/modules/societies/unit/unit.model', () => ({}));

const sequelize = require('../src/config/database');
const repository = require('../src/modules/residents/owner-unit/ownerUnit.repository');
const Resident = require('../src/modules/residents/resident/resident.model');
const ownerUnitService = require('../src/modules/residents/owner-unit/ownerUnit.service');

const transaction = { LOCK: { UPDATE: 'UPDATE' } };
const moveIn = {
  societyId: 'society-a', unitId: 'unit-a', residentId: 'owner-a', occupancyType: 'OWNER',
};

beforeEach(() => {
  jest.clearAllMocks();
  Resident.findOne.mockResolvedValue({ id: 'owner-a', societyId: 'society-a' });
  sequelize.query.mockResolvedValue([{ id: 'unit-a' }]);
});

test('OWNER Move-In reuses the matching active, effective OwnerUnit', async () => {
  const relation = { id: 'owner-unit-a', status: 'ACTIVE', ownershipType: 'PRIMARY_OWNER' };
  repository.findEffectiveActiveRelation.mockResolvedValue([relation]);

  await expect(ownerUnitService.ensureExistingOwnerUnitForMoveIn(moveIn, '2026-11-19', transaction))
    .resolves.toBe(relation);

  expect(repository.findEffectiveActiveRelation).toHaveBeenCalledWith(
    'society-a', 'owner-a', 'unit-a', '2026-11-19', transaction,
  );
  expect(repository.create).not.toHaveBeenCalled();
});

test('OWNER Move-In rejects missing ownership instead of silently accepting or creating it', async () => {
  repository.findEffectiveActiveRelation.mockResolvedValue([]);

  await expect(ownerUnitService.ensureExistingOwnerUnitForMoveIn(moveIn, '2026-11-19', transaction))
    .rejects.toThrow('An active ownership relationship for this resident and unit is required');
  expect(repository.create).not.toHaveBeenCalled();
});

test('OWNER Move-In rejects ambiguous duplicate active ownership relationships', async () => {
  repository.findEffectiveActiveRelation.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);

  await expect(ownerUnitService.ensureExistingOwnerUnitForMoveIn(moveIn, '2026-11-19', transaction))
    .rejects.toThrow('Multiple active ownership relationships match this Move-In');
  expect(repository.create).not.toHaveBeenCalled();
});

test('cross-society resident or unit is rejected and ownership lookup remains society scoped', async () => {
  Resident.findOne.mockResolvedValue(null);
  await expect(ownerUnitService.ensureExistingOwnerUnitForMoveIn(moveIn, '2026-11-19', transaction))
    .rejects.toThrow('Owner/Resident does not belong to the selected society');
  expect(repository.findEffectiveActiveRelation).not.toHaveBeenCalled();

  Resident.findOne.mockResolvedValue({ id: 'owner-a', societyId: 'society-a' });
  sequelize.query.mockResolvedValue([]);
  await expect(ownerUnitService.ensureExistingOwnerUnitForMoveIn(moveIn, '2026-11-19', transaction))
    .rejects.toThrow('Unit does not belong to the selected society');
  expect(sequelize.query.mock.calls[0][0]).toContain('t.society_id = :societyId');
  expect(sequelize.query.mock.calls[0][1].replacements).toEqual({ unitId: 'unit-a', societyId: 'society-a' });
  expect(repository.findEffectiveActiveRelation).not.toHaveBeenCalled();
});
