jest.mock('../src/modules/financial/billing/billing.model', () => ({ findOne: jest.fn() }));

const { Op } = require('sequelize');
const Billing = require('../src/modules/financial/billing/billing.model');
const BillingRepository = require('../src/modules/financial/billing/billing.repository');

beforeEach(() => jest.clearAllMocks());

test('monthly maintenance duplicate lookup is scoped to society, unit, period and config under the issue transaction', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  Billing.findOne.mockResolvedValue(null);

  await BillingRepository.findIssuedMonthlyMaintenanceDuplicate({
    societyId: 'society-a',
    unitId: 'unit-a',
    billingPeriod: '2026-11',
    billingConfigId: 'monthly-maintenance-a',
    excludeBillingId: 'bill-being-issued',
    transaction,
  });

  const options = Billing.findOne.mock.calls[0][0];
  expect(options.where).toEqual({
    societyId: 'society-a',
    unitId: 'unit-a',
    billingPeriod: '2026-11',
    billingConfigId: 'monthly-maintenance-a',
    id: { [Op.ne]: 'bill-being-issued' },
    status: { [Op.in]: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] },
  });
  expect(options.transaction).toBe(transaction);
  expect(options.lock).toBe(transaction.LOCK.UPDATE);
});

test('draft monthly bills block another issue while cancelled bills do not', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  await BillingRepository.findIssuedMonthlyMaintenanceDuplicate({
    societyId: 'society-a', unitId: 'unit-a', billingPeriod: '2026-11',
    billingConfigId: 'monthly-maintenance-a', excludeBillingId: 'bill-new', transaction,
  });

  const statuses = Billing.findOne.mock.calls[0][0].where.status[Op.in];
  expect(statuses).toContain('DRAFT');
  expect(statuses).not.toContain('CANCELLED');
});

test('resident-scoped monthly duplicate lookup uses member id and remains society scoped', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  await BillingRepository.findIssuedMonthlyMaintenanceDuplicate({
    societyId: 'society-a', memberId: 'resident-a', unitId: 'unit-a',
    billingPeriod: '2026-11', billingConfigId: 'monthly-maintenance-a', transaction,
  });
  expect(Billing.findOne.mock.calls[0][0].where).toEqual({
    societyId: 'society-a', memberId: 'resident-a', billingPeriod: '2026-11',
    billingConfigId: 'monthly-maintenance-a',
    status: { [Op.in]: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] },
  });
});

test('monthly scope lock includes society, billing rule and billing month for concurrent creation', async () => {
  const transaction = {};
  Billing.sequelize = { query: jest.fn().mockResolvedValue([]) };
  await BillingRepository.lockMonthlyMaintenanceScope({
    societyId: 'society-a', memberId: 'resident-a', unitId: 'unit-a',
    billingPeriod: '2026-11', billingConfigId: 'monthly-maintenance-a', transaction,
  });
  expect(Billing.sequelize.query).toHaveBeenCalledWith(
    'SELECT pg_advisory_xact_lock(hashtext(:scope), hashtext(:residentScopeId))',
    expect.objectContaining({
      replacements: {
        scope: 'housing-society-monthly-maintenance:society-a:monthly-maintenance-a:2026-11',
        residentScopeId: 'resident-a',
      },
      transaction,
    }),
  );
});
