jest.mock('../src/modules/move-InOut/access/accessAssignment.model', () => ({
  create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(),
}));

const AccessAssignment = require('../src/modules/move-InOut/access/accessAssignment.model');
const repository = require('../src/modules/move-InOut/access/accessAssignment.repository');
const transaction = { LOCK: { UPDATE: 'UPDATE' } };
const assignment = { id: 'access-a', update: jest.fn(), destroy: jest.fn(), accessStatus: 'ACTIVE' };

beforeEach(() => {
  jest.clearAllMocks();
  AccessAssignment.findOne.mockResolvedValue(assignment);
  AccessAssignment.findAll.mockResolvedValue([assignment]);
  assignment.update.mockResolvedValue(assignment);
  assignment.destroy.mockResolvedValue(assignment);
});

test.each([
  ['collection', () => repository.findAll('society-a'), AccessAssignment.findAll, { societyId: 'society-a' }],
  ['active collection', () => repository.findActive('society-a'), AccessAssignment.findAll, { societyId: 'society-a', accessStatus: 'ACTIVE' }],
  ['ID lookup', () => repository.findById('access-a', 'society-a'), AccessAssignment.findOne, { id: 'access-a', societyId: 'society-a' }],
  ['active Unit', () => repository.findActiveByUnit('unit-a', 'society-a'), AccessAssignment.findOne, { unitId: 'unit-a', societyId: 'society-a', accessStatus: 'ACTIVE' }],
  ['active Resident', () => repository.findActiveByResident('resident-a', 'society-a'), AccessAssignment.findAll, { residentId: 'resident-a', societyId: 'society-a', accessStatus: 'ACTIVE' }],
  ['Unit history', () => repository.findByUnit('unit-a', 'society-a'), AccessAssignment.findAll, { unitId: 'unit-a', societyId: 'society-a' }],
  ['Resident history', () => repository.findByResident('resident-a', 'society-a'), AccessAssignment.findAll, { residentId: 'resident-a', societyId: 'society-a' }],
  ['lifecycle history', () => repository.findByLifecycle('MOVE_IN', 'move-in-a', 'society-a'), AccessAssignment.findAll, { lifecycleType: 'MOVE_IN', lifecycleId: 'move-in-a', societyId: 'society-a' }],
])('%s repository query includes Society scope', async (_name, call, modelMethod, expectedWhere) => {
  await call();
  expect(modelMethod.mock.calls[0][0].where).toEqual(expectedWhere);
});

test('resident history repository method is implemented and society-scoped', async () => {
  await expect(repository.findByResident('resident-a', 'society-a')).resolves.toEqual([assignment]);
  expect(AccessAssignment.findAll).toHaveBeenCalledWith(expect.objectContaining({
    where: { residentId: 'resident-a', societyId: 'society-a' },
  }));
});

test('updates and deletes first retrieve the record by both ID and Society', async () => {
  await repository.update('access-a', 'society-a', { accessStatus: 'REVOKED' });
  expect(AccessAssignment.findOne).toHaveBeenCalledWith({ where: { id: 'access-a', societyId: 'society-a' } });
  expect(assignment.update).toHaveBeenCalledWith({ accessStatus: 'REVOKED' });

  AccessAssignment.findOne.mockClear();
  await repository.deleteById('access-a', 'society-a');
  expect(AccessAssignment.findOne).toHaveBeenCalledWith({ where: { id: 'access-a', societyId: 'society-a' } });
  expect(assignment.destroy).toHaveBeenCalled();
});

test('transactional active Resident query retains update lock and Society predicate', async () => {
  await repository.findActiveByResident('resident-a', 'society-a', transaction);
  expect(AccessAssignment.findAll).toHaveBeenCalledWith(expect.objectContaining({
    where: { residentId: 'resident-a', societyId: 'society-a', accessStatus: 'ACTIVE' },
    transaction,
    lock: 'UPDATE',
  }));
});
