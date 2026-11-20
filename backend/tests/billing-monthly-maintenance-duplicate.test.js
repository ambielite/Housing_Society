jest.mock('../src/modules/financial/billing/billing.model', () => ({ findOne: jest.fn() }));

const { Op } = require('sequelize');
const Billing = require('../src/modules/financial/billing/billing.model');
const BillingRepository = require('../src/modules/financial/billing/billing.repository');

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
    status: { [Op.in]: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] },
  });
  expect(options.transaction).toBe(transaction);
  expect(options.lock).toBe(transaction.LOCK.UPDATE);
});

test('draft and cancelled bills do not block issuance', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  await BillingRepository.findIssuedMonthlyMaintenanceDuplicate({
    societyId: 'society-a', unitId: 'unit-a', billingPeriod: '2026-11',
    billingConfigId: 'monthly-maintenance-a', excludeBillingId: 'bill-new', transaction,
  });

  const statuses = Billing.findOne.mock.calls[0][0].where.status[Op.in];
  expect(statuses).not.toContain('DRAFT');
  expect(statuses).not.toContain('CANCELLED');
});
