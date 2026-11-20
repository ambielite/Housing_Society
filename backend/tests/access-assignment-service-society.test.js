jest.mock('../src/config/database', () => ({ query: jest.fn(), close: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/modules/residents/resident/resident.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/move-InOut/access/accessAssignment.repository', () => ({
  create: jest.fn(), findActiveByResident: jest.fn(), findById: jest.fn(), update: jest.fn(),
  findByResident: jest.fn(), findAll: jest.fn(), findByUnit: jest.fn(), findActive: jest.fn(),
  findActiveByUnit: jest.fn(), findByLifecycle: jest.fn(), deleteById: jest.fn(),
}));

const sequelize = require('../src/config/database');
const Resident = require('../src/modules/residents/resident/resident.model');
const repository = require('../src/modules/move-InOut/access/accessAssignment.repository');
const service = require('../src/modules/move-InOut/access/accessAssignment.service');

const transaction = { LOCK: { UPDATE: 'UPDATE' } };
const input = {
  societyId: 'society-a', unitId: 'unit-a', residentId: 'resident-a',
  lifecycleType: 'MOVE_IN', lifecycleId: 'move-in-a', accessType: 'TENANT',
};

beforeEach(() => {
  jest.clearAllMocks();
  Resident.findOne.mockResolvedValue({ id: 'resident-a', societyId: 'society-a' });
  sequelize.query.mockResolvedValue([{ id: 'unit-a' }]);
  repository.findActiveByResident.mockResolvedValue([]);
  repository.create.mockResolvedValue({ id: 'access-a', ...input });
});

test('Access creation validates resident and Unit against the same Society before insert', async () => {
  await service.createAccessAssignment(input, transaction);

  expect(Resident.findOne).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'resident-a', societyId: 'society-a' }, transaction,
  }));
  expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('t.society_id = :societyId'), expect.objectContaining({
    replacements: { unitId: 'unit-a', societyId: 'society-a' }, transaction,
  }));
  expect(repository.findActiveByResident).toHaveBeenCalledWith('resident-a', 'society-a', transaction);
  expect(repository.create).toHaveBeenCalledWith(expect.objectContaining(input), transaction);
});

test('Access creation rejects a Unit or Resident from another Society', async () => {
  sequelize.query.mockResolvedValueOnce([]);
  await expect(service.createAccessAssignment(input)).rejects.toThrow('Unit does not belong to the selected society');
  expect(repository.create).not.toHaveBeenCalled();

  Resident.findOne.mockResolvedValue(null);
  await expect(service.createAccessAssignment(input)).rejects.toThrow('Resident does not belong to the selected society');
  expect(repository.create).not.toHaveBeenCalled();
});

test('revoke, suspend, reactivate and delete cannot mutate an assignment outside the Society', async () => {
  repository.findById.mockResolvedValue(null);

  await expect(service.revokeAccess('foreign-access', 'society-a', 'admin-a')).rejects.toThrow('Access assignment not found');
  await expect(service.suspendAccess('foreign-access', 'society-a')).rejects.toThrow('Access assignment not found');
  await expect(service.reactivateAccess('foreign-access', 'society-a', 'admin-a')).rejects.toThrow('Access assignment not found');
  await expect(service.deleteAccessAssignment('foreign-access', 'society-a')).rejects.toThrow('Access assignment not found');

  expect(repository.findById).toHaveBeenNthCalledWith(1, 'foreign-access', 'society-a');
  expect(repository.findById).toHaveBeenNthCalledWith(2, 'foreign-access', 'society-a');
  expect(repository.findById).toHaveBeenNthCalledWith(3, 'foreign-access', 'society-a');
  expect(repository.deleteById).toHaveBeenCalledWith('foreign-access', 'society-a');
  expect(repository.update).not.toHaveBeenCalled();
});

test('resident history uses the implemented Society-scoped repository method', async () => {
  repository.findByResident.mockResolvedValue([{ id: 'access-a' }]);

  await expect(service.getAccessHistoryByResident('resident-a', 'society-a')).resolves.toEqual([{ id: 'access-a' }]);
  expect(repository.findByResident).toHaveBeenCalledWith('resident-a', 'society-a');
});

test('all access queries require an authenticated Society argument', async () => {
  await expect(service.getAccessAssignments()).rejects.toThrow('Society ID is required');
  await expect(service.getAccessAssignment('access-a')).rejects.toThrow('Society ID is required');
  await expect(service.getActiveAccess()).rejects.toThrow('Society ID is required');
  expect(repository.findAll).not.toHaveBeenCalled();
});
