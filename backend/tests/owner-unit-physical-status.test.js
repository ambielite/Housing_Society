jest.mock('../src/modules/residents/owner-unit/ownerUnit.repository', () => ({
  create: jest.fn(), findRelation: jest.fn(), findOverlappingRelation: jest.fn(),
  findPrimaryOwner: jest.fn(), findActiveUnitOwners: jest.fn(), findById: jest.fn(), update: jest.fn(),
}));
jest.mock('../src/modules/societies/society/society.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/societies/unit/unit.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/residents/resident/resident.model', () => ({ findByPk: jest.fn() }));

const repository = require('../src/modules/residents/owner-unit/ownerUnit.repository');
const Society = require('../src/modules/societies/society/society.model');
const Unit = require('../src/modules/societies/unit/unit.model');
const Resident = require('../src/modules/residents/resident/resident.model');
const ownerUnitService = require('../src/modules/residents/owner-unit/ownerUnit.service');

const societyId = '00000000-0000-4000-8000-000000000001';
const unitId = '00000000-0000-4000-8000-000000000002';
const ownerId = '00000000-0000-4000-8000-000000000003';
const unitRecord = { id: unitId, update: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  Society.findByPk.mockResolvedValue({ id: societyId });
  Unit.findByPk.mockResolvedValue(unitRecord);
  Resident.findByPk.mockResolvedValue({ id: ownerId });
  repository.findRelation.mockResolvedValue(null);
  repository.findOverlappingRelation.mockResolvedValue(null);
  repository.findPrimaryOwner.mockResolvedValue(null);
  unitRecord.update.mockClear();
});

test('creating active OwnerUnit leaves physical Unit status unchanged', async () => {
  repository.create.mockResolvedValue({ id: 'owner-unit-a', status: 'ACTIVE' });

  await ownerUnitService.createOwnerUnit({
    societyId, unitId, ownerId, ownershipType: 'PRIMARY_OWNER', effectiveFrom: '2026-01-01', status: 'ACTIVE',
  });

  expect(repository.create).toHaveBeenCalled();
  expect(unitRecord.update).not.toHaveBeenCalled();
});

test('updating active OwnerUnit leaves physical Unit status unchanged', async () => {
  const record = { id: '00000000-0000-4000-8000-000000000004', societyId, unitId, status: 'ACTIVE' };
  repository.findById.mockResolvedValue(record);
  repository.update.mockResolvedValue({ ...record, status: 'ACTIVE' });

  await ownerUnitService.updateOwnerUnit(record.id, { status: 'ACTIVE' });

  expect(repository.update).toHaveBeenCalled();
  expect(Unit.findByPk).not.toHaveBeenCalled();
});
