jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/societies/unit/unit.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/move-InOut/occupancy/occupancy.model', () => ({ findOne: jest.fn() }));

const sequelize = require('../src/config/database');
const Unit = require('../src/modules/societies/unit/unit.model');
const Occupancy = require('../src/modules/move-InOut/occupancy/occupancy.model');
const { recalculateUnitStatus } = require('../src/modules/move-InOut/unitStatus.service');

const transaction = { LOCK: { UPDATE: 'UPDATE' } };
const unit = (status) => ({ update: jest.fn(async function update(values) { this.status = values.status; }) , status });

beforeEach(() => {
  jest.clearAllMocks();
  sequelize.query.mockResolvedValue([{ id: 'unit-a', status: 'OCCUPIED' }]);
  Occupancy.findOne.mockResolvedValue(null);
});

test('Tenant Move-In recalculates an effective Occupancy to OCCUPIED', async () => {
  sequelize.query.mockResolvedValue([{ id: 'unit-a', status: 'VACANT' }]);
  Occupancy.findOne.mockResolvedValue({ id: 'occupancy-a' });
  const record = unit('VACANT');
  Unit.findByPk.mockResolvedValue(record);

  await expect(recalculateUnitStatus({ societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2026-11-19', transaction }))
    .resolves.toBe('OCCUPIED');

  expect(record.update).toHaveBeenCalledWith({ status: 'OCCUPIED' }, { transaction });
});

test('Tenant Move-Out makes Unit VACANT when no effective occupant or owner remains', async () => {
  const record = unit('OCCUPIED');
  Unit.findByPk.mockResolvedValue(record);

  await expect(recalculateUnitStatus({ societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2026-11-19', transaction }))
    .resolves.toBe('VACANT');

  expect(record.update).toHaveBeenCalledWith({ status: 'VACANT' }, { transaction });
});

test('Unit remains OCCUPIED while another effective Tenant Occupancy remains', async () => {
  Occupancy.findOne.mockResolvedValue({ id: 'other-tenant-occupancy' });

  await expect(recalculateUnitStatus({ societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2026-11-19', transaction }))
    .resolves.toBe('OCCUPIED');

  expect(Unit.findByPk).not.toHaveBeenCalled();
});

test('active OwnerUnit without physical Occupancy results in VACANT', async () => {
  const record = unit('OCCUPIED');
  Unit.findByPk.mockResolvedValue(record);

  await expect(recalculateUnitStatus({ societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2026-11-19', transaction }))
    .resolves.toBe('VACANT');

  expect(record.update).toHaveBeenCalledWith({ status: 'VACANT' }, { transaction });
});

test.each(['TENANT', 'OWNER'])('effective %s Occupancy results in OCCUPIED', async (occupancyType) => {
  sequelize.query.mockResolvedValue([{ id: 'unit-a', status: 'VACANT' }]);
  Occupancy.findOne.mockResolvedValue({ id: `${occupancyType.toLowerCase()}-occupancy`, occupancyType });
  const record = unit('VACANT');
  Unit.findByPk.mockResolvedValue(record);

  await expect(recalculateUnitStatus({ societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2026-11-19', transaction }))
    .resolves.toBe('OCCUPIED');

  expect(Occupancy.findOne.mock.calls[0][0].where.occupancyType).toEqual(expect.anything());
  expect(record.update).toHaveBeenCalledWith({ status: 'OCCUPIED' }, { transaction });
});

test('INACTIVE Unit remains INACTIVE even if an Occupancy record exists', async () => {
  sequelize.query.mockResolvedValue([{ id: 'unit-a', status: 'INACTIVE' }]);
  Occupancy.findOne.mockResolvedValue({ id: 'owner-occupancy', occupancyType: 'OWNER' });

  await expect(recalculateUnitStatus({ societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2026-11-19', transaction }))
    .resolves.toBe('INACTIVE');

  expect(Unit.findByPk).not.toHaveBeenCalled();
});

test('Unit and relationship lookups stay scoped to the supplied Society and Unit', async () => {
  await recalculateUnitStatus({ societyId: 'society-a', unitId: 'unit-a', effectiveDate: '2026-11-19', transaction });

  expect(sequelize.query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    replacements: { unitId: 'unit-a', societyId: 'society-a' }, transaction,
  }));
  expect(Occupancy.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ societyId: 'society-a', unitId: 'unit-a' }) }));
});
