jest.mock('../src/config/database', () => ({
  transaction: jest.fn(),
  query: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/financial/billing-config/billingConfig.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../src/modules/financial/billing/billing.model', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../src/modules/societies/unit/unit.model', () => ({}));
jest.mock('../src/modules/societies/floor/floor.model', () => ({}));
jest.mock('../src/modules/societies/tower/tower.model', () => ({}));
jest.mock('../src/modules/financial/ledger-account/ledgerAccount.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../src/modules/financial/billing/billing.service', () => ({
  calculatePayableTotal: jest.fn(({ subtotal, taxAmount, penaltyAmount }) =>
    Number((subtotal + taxAmount + penaltyAmount).toFixed(2))),
  calculateCompleteBilling: jest.fn(),
  getPenaltyRuleSnapshot: jest.fn().mockResolvedValue({ applicable: false }),
  issueBilling: jest.fn(),
  applyPenaltyToBill: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.service', () => ({
  createInvoice: jest.fn(),
  issueInvoice: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.repository', () => ({
  findByIdempotencyKey: jest.fn(),
  findOutstandingByUnit: jest.fn(),
  lockUnitFinancialScope: jest.fn(),
}));

const sequelize = require('../src/config/database');
const BillingConfig = require('../src/modules/financial/billing-config/billingConfig.model');
const Billing = require('../src/modules/financial/billing/billing.model');
const LedgerAccount = require('../src/modules/financial/ledger-account/ledgerAccount.model');
const BillingService = require('../src/modules/financial/billing/billing.service');
const InvoiceService = require('../src/modules/financial/invoice/invoice.service');
const InvoiceRepository = require('../src/modules/financial/invoice/invoice.repository');
const scheduler = require('../src/modules/financial/billing-scheduler/billingScheduler.service');

beforeEach(() => {
  jest.clearAllMocks();
  sequelize.query.mockResolvedValue([{ column_exists: true }]);
});

test('scheduled payable total uses the shared Billing component rule', () => {
  expect(scheduler.calculateScheduledTotal({
    subtotal: 5000,
    previousBalance: 2000,
    taxAmount: 0,
    penaltyAmount: 100,
  })).toBe(5100);
  expect(BillingService.calculatePayableTotal).toHaveBeenCalledWith({
    subtotal: 5000,
    previousBalance: 2000,
    taxAmount: 0,
    penaltyAmount: 100,
  });
});

test('scheduled Bill, Invoice, Journal issuance share one transaction', async () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: undefined,
    commit: jest.fn(async function commit() { this.finished = 'commit'; }),
    rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
  };
  const billing = { id: 'billing-a', status: 'DRAFT' };
  const invoice = { id: 'invoice-a', status: 'DRAFT' };
  sequelize.transaction.mockResolvedValue(transaction);
  InvoiceRepository.findByIdempotencyKey
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(null);
  LedgerAccount.findOne.mockResolvedValue({ id: 'ledger-a' });
  BillingService.calculateCompleteBilling.mockResolvedValue({
    subtotal: 5000,
    previousBalance: 2000,
    taxAmount: 0,
  });
  BillingService.calculatePayableTotal.mockReturnValue(5000);
  Billing.create.mockResolvedValue(billing);
  InvoiceService.createInvoice.mockResolvedValue({ invoice, duplicate: false });
  InvoiceService.issueInvoice.mockResolvedValue(invoice);
  BillingService.issueBilling.mockResolvedValue({ ...billing, status: 'ISSUED' });

  const result = await scheduler.generateForUnit({
    societyId: 'society-a',
    unit: { id: 'unit-a', carpetArea: 100 },
    billingRule: {
      id: 'rule-a',
      code: 'MAINT',
      name: 'Maintenance',
      billingModel: 'FLAT_RATE',
      flatAmount: 5000,
      isTaxable: false,
    },
    billingCycle: { billingFrequency: 'MONTHLY', dueDays: 10 },
    billingDate: '2026-11-01',
  });

  expect(Billing.create).toHaveBeenCalledWith(
    expect.objectContaining({ totalAmount: 5000, previousBalance: 2000 }),
    { transaction }
  );
  expect(InvoiceService.createInvoice).toHaveBeenCalledWith(
    expect.objectContaining({
      accountingTotals: expect.objectContaining({ previousBalance: 2000 }),
      items: expect.not.arrayContaining([
        expect.objectContaining({ description: expect.stringMatching(/previous balance/i) }),
      ]),
    }),
    { transaction }
  );
  expect(InvoiceService.issueInvoice).toHaveBeenCalledWith(invoice.id, transaction);
  expect(BillingService.issueBilling).toHaveBeenCalledWith(billing.id, { transaction });
  expect(transaction.commit).toHaveBeenCalledTimes(1);
  expect(transaction.rollback).not.toHaveBeenCalled();
  expect(result.billing.status).toBe('ISSUED');
});

test('scheduled Invoice failure rolls back the Billing write', async () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: undefined,
    commit: jest.fn(async function commit() { this.finished = 'commit'; }),
    rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
  };
  sequelize.transaction.mockResolvedValue(transaction);
  InvoiceRepository.findByIdempotencyKey
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(null);
  LedgerAccount.findOne.mockResolvedValue({ id: 'ledger-a' });
  BillingService.calculateCompleteBilling.mockResolvedValue({
    subtotal: 5000,
    previousBalance: 0,
    taxAmount: 0,
  });
  BillingService.calculatePayableTotal.mockReturnValue(5000);
  Billing.create.mockResolvedValue({ id: 'billing-a', status: 'DRAFT' });
  InvoiceService.createInvoice.mockRejectedValueOnce(new Error('invoice failed'));

  await expect(scheduler.generateForUnit({
    societyId: 'society-a',
    unit: { id: 'unit-a', carpetArea: 100 },
    billingRule: {
      id: 'rule-a',
      code: 'MAINT',
      name: 'Maintenance',
      billingModel: 'FLAT_RATE',
      flatAmount: 5000,
      isTaxable: false,
    },
    billingCycle: { billingFrequency: 'MONTHLY', dueDays: 10 },
    billingDate: '2026-11-01',
  })).rejects.toThrow('invoice failed');

  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
  expect(BillingService.issueBilling).not.toHaveBeenCalled();
});

test('scheduled Monthly Flat Maintenance rolls back when the shared issue guard rejects a duplicate', async () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: undefined,
    commit: jest.fn(async function commit() { this.finished = 'commit'; }),
    rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
  };
  const billing = { id: 'scheduled-bill', status: 'DRAFT' };
  const invoice = { id: 'scheduled-invoice', status: 'DRAFT' };
  sequelize.transaction.mockResolvedValue(transaction);
  InvoiceRepository.findByIdempotencyKey
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(null);
  LedgerAccount.findOne.mockResolvedValue({ id: 'ledger-a' });
  BillingService.calculateCompleteBilling.mockResolvedValue({ subtotal: 5000, previousBalance: 0, taxAmount: 0 });
  BillingService.calculatePayableTotal.mockReturnValue(5000);
  Billing.create.mockResolvedValue(billing);
  InvoiceService.createInvoice.mockResolvedValue({ invoice, duplicate: false });
  InvoiceService.issueInvoice.mockResolvedValue(invoice);
  BillingService.issueBilling.mockRejectedValue(new Error(
    'Monthly Flat Maintenance bill has already been issued for this unit for the selected billing period.'
  ));

  await expect(scheduler.generateForUnit({
    societyId: 'society-a',
    unit: { id: 'unit-a', carpetArea: 100 },
    billingRule: {
      id: 'monthly-maintenance-rule',
      code: 'BR-MNT-001',
      name: 'Monthly Flat Maintenance',
      billingModel: 'FLAT_RATE',
      flatAmount: 5000,
      isTaxable: false,
    },
    billingCycle: { billingFrequency: 'MONTHLY', dueDays: 10 },
    billingDate: '2026-11-01',
  })).rejects.toThrow('Monthly Flat Maintenance bill has already been issued');

  expect(BillingService.issueBilling).toHaveBeenCalledWith(billing.id, { transaction });
  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('daily penalty pass processes eligible bills across societies and isolates bill failures', async () => {
  const candidates = [
    { id: 'bill-a', societyId: 'society-a', billNumber: 'A-1' },
    { id: 'bill-b', societyId: 'society-b', billNumber: 'B-1' },
    { id: 'bill-c', societyId: 'society-b', billNumber: 'B-2' },
  ];
  Billing.findAll.mockResolvedValue(candidates);
  BillingService.applyPenaltyToBill
    .mockResolvedValueOnce({ applied: true, penaltyAmount: 100 })
    .mockRejectedValueOnce(new Error('accounting period missing'))
    .mockResolvedValueOnce({ applied: false, reason: 'GRACE_PERIOD' });

  const result = await scheduler.runOverduePenaltyPass({ asOfDate: '2026-11-29' });

  expect(Billing.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
    outstandingAmount: expect.any(Object), penaltyAmount: 0,
    status: expect.any(Object),
  }) }));
  expect(BillingService.applyPenaltyToBill).toHaveBeenCalledTimes(3);
  expect(result).toMatchObject({ candidateCount: 3, appliedCount: 1, failedCount: 1 });
  expect(result.results[1]).toMatchObject({ societyId: 'society-b', error: 'accounting period missing' });
  expect(result.results[2]).toMatchObject({ societyId: 'society-b', reason: 'GRACE_PERIOD' });
});

test('daily penalty pass skips before querying bills when the snapshot column is missing', async () => {
  sequelize.query.mockResolvedValueOnce([{ column_exists: false }]);

  const result = await scheduler.runOverduePenaltyPass({ asOfDate: '2026-11-29' });

  expect(result).toMatchObject({ skipped: true, reason: 'PENALTY_SNAPSHOT_SCHEMA_NOT_READY' });
  expect(Billing.findAll).not.toHaveBeenCalled();
  expect(BillingService.applyPenaltyToBill).not.toHaveBeenCalled();
});
