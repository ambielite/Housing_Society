jest.mock('../src/config/db', () => ({
  pool: { end: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../src/config/database', () => ({
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/financial/billing/billing.repository', () => ({
  findById: jest.fn(),
  findIssuedMonthlyMaintenanceDuplicate: jest.fn(),
  lockMonthlyMaintenanceScope: jest.fn(),
}));
jest.mock('../src/modules/financial/billing-config/billingConfig.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/financial/ledger-account/ledgerAccount.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/financial/account/account.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/financial/accounting-period/accountingPeriod.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/financial/journal/journal.model', () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock('../src/modules/financial/journal/journalLine.model', () => ({ create: jest.fn() }));
jest.mock('../src/modules/financial/invoice/invoice.service', () => ({
  createInvoice: jest.fn(),
  issueInvoice: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.repository', () => ({
  findByBillingId: jest.fn(),
  findById: jest.fn(),
  findOutstandingByUnit: jest.fn(),
  lockUnitFinancialScope: jest.fn(),
  createItem: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.model', () => ({}));
jest.mock('../src/modules/financial/invoice/invoiceItem.model', () => ({ destroy: jest.fn() }));
jest.mock('../src/modules/financial/invoice/previousBalance.service', () => ({ hasSourceTable: jest.fn() }));
jest.mock('../src/modules/financial/tax/tax.service', () => ({
  calculateInvoiceTax: jest.fn().mockResolvedValue({ totalTax: 0 }),
}));

const sequelize = require('../src/config/database');
const billingRepository = require('../src/modules/financial/billing/billing.repository');
const LedgerAccount = require('../src/modules/financial/ledger-account/ledgerAccount.model');
const Account = require('../src/modules/financial/account/account.model');
const BillingConfig = require('../src/modules/financial/billing-config/billingConfig.model');
const AccountingPeriod = require('../src/modules/financial/accounting-period/accountingPeriod.model');
const Journal = require('../src/modules/financial/journal/journal.model');
const JournalLine = require('../src/modules/financial/journal/journalLine.model');
const InvoiceService = require('../src/modules/financial/invoice/invoice.service');
const InvoiceRepository = require('../src/modules/financial/invoice/invoice.repository');
const billingService = require('../src/modules/financial/billing/billing.service');

const makeTransaction = () => ({
  LOCK: { UPDATE: 'UPDATE' },
  finished: undefined,
  commit: jest.fn(async function commit() { this.finished = 'commit'; }),
  rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
});

const makeFixture = () => {
  const transaction = makeTransaction();
  const billing = {
    id: 'billing-a',
    societyId: 'society-a',
    unitId: 'unit-a',
    memberId: null,
    billNumber: 'BILL-TEST-1',
    billingPeriod: '2026-11',
    billDate: '2026-11-01',
    dueDate: '2026-11-10',
    subtotal: '100.00',
    taxAmount: '0.00',
    penaltyAmount: '0.00',
    previousBalance: '0.00',
    totalAmount: '100.00',
    paidAmount: '0.00',
    outstandingAmount: '100.00',
    status: 'DRAFT',
    journalId: null,
    update: jest.fn(async function update(values) { Object.assign(this, values); }),
  };
  const invoice = {
    id: 'invoice-a',
    societyId: billing.societyId,
    unitId: billing.unitId,
    memberId: null,
    billingId: billing.id,
    invoiceNumber: `INV-${billing.billNumber}`,
    billingPeriod: billing.billingPeriod,
    invoiceDate: billing.billDate,
    dueDate: billing.dueDate,
    previousBalance: 0,
    subtotal: 100,
    taxAmount: 0,
    penaltyAmount: 0,
    totalAmount: 100,
    paidAmount: 0,
    outstandingAmount: 100,
    status: 'DRAFT',
    journalId: null,
    items: [{ amount: 100, taxAmount: 0, totalAmount: 100 }],
    update: jest.fn(async function update(values) { Object.assign(this, values); }),
  };
  const journal = {
    id: 'journal-a',
    update: jest.fn(async function update(values) { Object.assign(this, values); }),
  };

  sequelize.transaction.mockResolvedValue(transaction);
  billingRepository.findById.mockResolvedValue(billing);
  AccountingPeriod.findOne.mockResolvedValue({ id: 'period-a' });
  LedgerAccount.findOne.mockResolvedValue({ id: 'ledger-a', accountId: 'receivable-a' });
  Account.findOne
    .mockResolvedValueOnce({ id: 'receivable-a' })
    .mockResolvedValueOnce({ id: 'income-a' });
  Journal.findOne.mockResolvedValue(null);
  Journal.create.mockResolvedValue(journal);
  JournalLine.create.mockResolvedValue({});
  InvoiceRepository.findOutstandingByUnit.mockResolvedValue([]);
  InvoiceRepository.lockUnitFinancialScope.mockResolvedValue(undefined);
  InvoiceService.createInvoice.mockResolvedValue({ invoice, duplicate: false });
  InvoiceService.issueInvoice.mockImplementation(async () => { invoice.status = 'ISSUED'; });

  return { transaction, billing, invoice, journal };
};

beforeEach(() => {
  jest.clearAllMocks();
  InvoiceRepository.findByBillingId.mockResolvedValue(null);
  billingRepository.findIssuedMonthlyMaintenanceDuplicate.mockResolvedValue(null);
  billingRepository.lockMonthlyMaintenanceScope.mockResolvedValue(undefined);
});

test('Bill issue creates the shared Invoice, two Journal Lines and commits once', async () => {
  const { transaction, billing, invoice, journal } = makeFixture();

  const result = await billingService.issueBilling(billing.id);

  expect(billingRepository.findById).toHaveBeenCalledWith(billing.id, transaction, true);
  expect(InvoiceService.createInvoice).toHaveBeenCalledWith(
    expect.objectContaining({
      societyId: billing.societyId,
      unitId: billing.unitId,
      memberId: null,
      billingId: billing.id,
      idempotencyKey: `manual-billing:${billing.id}`,
    }),
    { transaction }
  );
  expect(InvoiceService.issueInvoice).toHaveBeenCalledWith(invoice.id, transaction);
  expect(JournalLine.create).toHaveBeenCalledTimes(2);
  expect(journal.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'POSTED' }), { transaction });
  expect(invoice.update).toHaveBeenCalledWith({ journalId: journal.id }, { transaction });
  expect(billing.status).toBe('ISSUED');
  expect(billing.journalId).toBe(journal.id);
  expect(transaction.commit).toHaveBeenCalledTimes(1);
  expect(transaction.rollback).not.toHaveBeenCalled();
  expect(result).toBe(billing);
});

test('first BR-MNT-001 bill issues and checks duplicates after acquiring the unit lock', async () => {
  const { transaction, billing } = makeFixture();
  billing.billingConfigId = 'monthly-maintenance-config';
  BillingConfig.findByPk.mockResolvedValue({
    id: billing.billingConfigId,
    societyId: billing.societyId,
    configType: 'BILLING_RULE',
    code: 'BR-MNT-001',
  });

  await billingService.issueBilling(billing.id);

  expect(billingRepository.findIssuedMonthlyMaintenanceDuplicate).toHaveBeenCalledWith({
    societyId: billing.societyId,
    unitId: billing.unitId,
    memberId: billing.memberId,
    billingPeriod: billing.billingPeriod,
    billingConfigId: billing.billingConfigId,
    excludeBillingId: billing.id,
    transaction,
  });
  expect(InvoiceRepository.lockUnitFinancialScope.mock.invocationCallOrder[0])
    .toBeLessThan(billingRepository.findIssuedMonthlyMaintenanceDuplicate.mock.invocationCallOrder[0]);
  expect(InvoiceService.createInvoice).toHaveBeenCalledTimes(1);
  expect(billing.status).toBe('ISSUED');
});

test('second BR-MNT-001 bill for the same scope is rejected before invoice or journal creation', async () => {
  const { transaction, billing } = makeFixture();
  billing.billingConfigId = 'monthly-maintenance-config';
  BillingConfig.findByPk.mockResolvedValue({
    id: billing.billingConfigId,
    societyId: billing.societyId,
    configType: 'BILLING_RULE',
    code: 'BR-MNT-001',
  });
  billingRepository.findIssuedMonthlyMaintenanceDuplicate.mockResolvedValue({ id: 'previous-bill' });

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow(
    'Monthly Flat Maintenance bill has already been issued for this unit for the selected billing period.'
  );

  expect(InvoiceService.createInvoice).not.toHaveBeenCalled();
  expect(Journal.create).not.toHaveBeenCalled();
  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('other billing configurations and cross-society configuration links do not run the monthly guard', async () => {
  const { billing } = makeFixture();
  billing.billingConfigId = 'different-config';
  BillingConfig.findByPk.mockResolvedValue({
    id: billing.billingConfigId, societyId: billing.societyId,
    configType: 'BILLING_RULE', code: 'BR-PARK-001',
  });
  await billingService.issueBilling(billing.id);
  expect(billingRepository.findIssuedMonthlyMaintenanceDuplicate).not.toHaveBeenCalled();

  jest.clearAllMocks();
  InvoiceRepository.findByBillingId.mockResolvedValue(null);
  billingRepository.findIssuedMonthlyMaintenanceDuplicate.mockResolvedValue(null);
  const otherSocietyFixture = makeFixture();
  otherSocietyFixture.billing.billingConfigId = 'mismatched-config';
  BillingConfig.findByPk.mockResolvedValue({
    id: otherSocietyFixture.billing.billingConfigId,
    societyId: 'different-society', configType: 'BILLING_RULE', code: 'BR-MNT-001',
  });
  await billingService.issueBilling(otherSocietyFixture.billing.id);
  expect(billingRepository.findIssuedMonthlyMaintenanceDuplicate).not.toHaveBeenCalled();
});

test.each([
  { societyId: 'society-a', unitId: 'unit-b' },
  { societyId: 'society-b', unitId: 'unit-a' },
])('BR-MNT-001 issue is independently allowed for another unit or society scope %#', async ({ societyId, unitId }) => {
  const { billing, invoice } = makeFixture();
  billing.societyId = societyId;
  billing.unitId = unitId;
  billing.billingConfigId = `monthly-maintenance-${societyId}`;
  invoice.societyId = societyId;
  invoice.unitId = unitId;
  BillingConfig.findByPk.mockResolvedValue({
    id: billing.billingConfigId,
    societyId,
    configType: 'BILLING_RULE',
    code: 'BR-MNT-001',
  });

  await billingService.issueBilling(billing.id);

  expect(billingRepository.findIssuedMonthlyMaintenanceDuplicate).toHaveBeenCalledWith(
    expect.objectContaining({ societyId, unitId, billingPeriod: billing.billingPeriod })
  );
});

test('concurrent BR-MNT-001 issue requests serialize on the unit lock and create only one invoice', async () => {
  const issuedBillIds = new Set();
  const makeBill = (id) => ({
    id, societyId: 'society-a', unitId: 'unit-a', memberId: null,
    billingConfigId: 'monthly-maintenance-config', billNumber: `BILL-${id}`,
    billingPeriod: '2026-11', billDate: '2026-11-01', dueDate: '2026-11-08',
    subtotal: '100.00', taxAmount: '0.00', penaltyAmount: '0.00',
    totalAmount: '100.00', paidAmount: '0.00', outstandingAmount: '100.00',
    status: 'DRAFT', journalId: null,
    update: jest.fn(async function update(values) {
      Object.assign(this, values);
      if (values.status === 'ISSUED') issuedBillIds.add(this.id);
    }),
  });
  const bills = [makeBill('bill-a'), makeBill('bill-b')];
  const invoices = bills.map((bill) => ({
    id: `invoice-${bill.id}`, societyId: bill.societyId, unitId: bill.unitId,
    memberId: null, billingId: bill.id, invoiceNumber: `INV-${bill.billNumber}`,
    billingPeriod: bill.billingPeriod, invoiceDate: bill.billDate, dueDate: bill.dueDate,
    previousBalance: 0, subtotal: 100, taxAmount: 0, penaltyAmount: 0,
    totalAmount: 100, paidAmount: 0, outstandingAmount: 100, status: 'DRAFT',
    journalId: null, items: [{ amount: 100, taxAmount: 0, totalAmount: 100 }],
    update: jest.fn(async function update(values) { Object.assign(this, values); }),
  }));
  const transactions = [makeTransaction(), makeTransaction()];
  let lockHolder = null;
  const lockWaiters = [];
  InvoiceRepository.lockUnitFinancialScope.mockImplementation(async (_societyId, _unitId, transaction) => {
    if (!lockHolder) {
      lockHolder = transaction;
      return;
    }
    await new Promise((resolve) => lockWaiters.push(resolve));
    lockHolder = transaction;
  });
  for (const transaction of transactions) {
    const commit = transaction.commit;
    transaction.commit = jest.fn(async function commitAndUnlock() {
      await commit.call(this);
      if (lockHolder === transaction) lockWaiters.shift()?.();
    });
  }
  sequelize.transaction
    .mockResolvedValueOnce(transactions[0])
    .mockResolvedValueOnce(transactions[1]);
  billingRepository.findById.mockImplementation(async (id) => bills.find((bill) => bill.id === id));
  BillingConfig.findByPk.mockResolvedValue({
    id: 'monthly-maintenance-config', societyId: 'society-a',
    configType: 'BILLING_RULE', code: 'BR-MNT-001',
  });
  billingRepository.findIssuedMonthlyMaintenanceDuplicate.mockImplementation(async () => (
    issuedBillIds.size ? { id: [...issuedBillIds][0] } : null
  ));
  AccountingPeriod.findOne.mockResolvedValue({ id: 'period-a' });
  LedgerAccount.findOne.mockResolvedValue({ id: 'ledger-a', accountId: 'receivable-a' });
  Account.findOne.mockImplementation(async ({ where }) => (
    where.accountType === 'RECEIVABLE' ? { id: 'receivable-a' } : { id: 'income-a' }
  ));
  Journal.findOne.mockResolvedValue(null);
  Journal.create.mockImplementation(async ({ referenceId }) => ({
    id: `journal-${referenceId}`,
    update: jest.fn().mockResolvedValue(undefined),
  }));
  JournalLine.create.mockResolvedValue({});
  InvoiceRepository.findOutstandingByUnit.mockResolvedValue([]);
  InvoiceRepository.findByBillingId.mockResolvedValue(null);
  InvoiceService.createInvoice.mockImplementation(async (data) => ({
    invoice: invoices.find((item) => item.billingId === data.billingId), duplicate: false,
  }));
  InvoiceService.issueInvoice.mockImplementation(async (invoiceId) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    invoice.status = 'ISSUED';
  });

  const results = await Promise.allSettled(bills.map((bill) => billingService.issueBilling(bill.id)));

  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  expect(results.find((result) => result.status === 'rejected').reason.message).toBe(
    'Monthly Flat Maintenance bill has already been issued for this unit for the selected billing period.'
  );
  expect(InvoiceService.createInvoice).toHaveBeenCalledTimes(1);
});

test('Invoice failure rolls back before creating or posting a Journal', async () => {
  const { transaction, billing } = makeFixture();
  InvoiceService.createInvoice.mockRejectedValueOnce(new Error('invoice item failure'));

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow('invoice item failure');

  expect(Journal.create).not.toHaveBeenCalled();
  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Bill issuance reuses the scheduler-created Invoice instead of creating a duplicate', async () => {
  const { transaction, billing, invoice, journal } = makeFixture();
  invoice.status = 'ISSUED';
  InvoiceRepository.findByBillingId.mockResolvedValue(invoice);

  await billingService.issueBilling(billing.id);

  expect(InvoiceService.createInvoice).not.toHaveBeenCalled();
  expect(InvoiceService.issueInvoice).not.toHaveBeenCalled();
  expect(InvoiceRepository.findByBillingId).toHaveBeenCalledWith(billing.id, transaction);
  expect(Journal.create).toHaveBeenCalledTimes(1);
  expect(journal.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'POSTED' }), { transaction });
  expect(transaction.commit).toHaveBeenCalledTimes(1);
});

test('positive Previous Balance stays informational and is excluded from Invoice Items and Journal', async () => {
  const { transaction, billing, invoice, journal } = makeFixture();
  Object.assign(billing, {
    billingConfigId: 'rule-a',
    subtotal: '5000.00',
    taxAmount: '250.00',
    previousBalance: '2000.00',
    penaltyAmount: '100.00',
    totalAmount: '5350.00',
    outstandingAmount: '5350.00',
  });
  BillingConfig.findByPk.mockResolvedValue({ chargeCategory: 'MAINTENANCE' });
  InvoiceRepository.findOutstandingByUnit.mockResolvedValue([{
    id: 'source-invoice-a',
    societyId: billing.societyId,
    unitId: billing.unitId,
    invoiceNumber: 'INV-OLD',
    status: 'PARTIALLY_PAID',
    outstandingAmount: '2000.00',
  }]);
  Object.assign(invoice, {
    subtotal: 5000,
    taxAmount: 250,
    previousBalance: 2000,
    penaltyAmount: 100,
    totalAmount: 5350,
    outstandingAmount: 5350,
    items: [
      { amount: 5000, taxAmount: 250, totalAmount: 5250 },
      { amount: 100, taxAmount: 0, totalAmount: 100 },
    ],
  });

  await billingService.issueBilling(billing.id);

  expect(InvoiceService.createInvoice).toHaveBeenCalledWith(
    expect.objectContaining({
      accountingTotals: {
        subtotal: 5000,
        taxAmount: 250,
        previousBalance: 2000,
        penaltyAmount: 100,
      },
      items: expect.arrayContaining([
        expect.objectContaining({ description: `Penalty for ${billing.billNumber}`, rate: 100 }),
      ]),
    }),
    { transaction }
  );
  expect(Journal.create).toHaveBeenCalledWith(
    expect.objectContaining({ totalDebit: 5350, totalCredit: 5350 }),
    { transaction }
  );
  expect(JournalLine.create).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ debitAmount: 5350, creditAmount: 0 }),
    { transaction }
  );
  expect(JournalLine.create).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ debitAmount: 0, creditAmount: 5350 }),
    { transaction }
  );
  expect(billing.totalAmount).toBe('5350.00');
  expect(billing.status).toBe('ISSUED');
  expect(journal.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'POSTED' }), { transaction });
});

test('inconsistent stored payable total is rejected regardless of display-only Previous Balance', async () => {
  const { transaction, billing } = makeFixture();
  billing.previousBalance = '20.00';
  billing.totalAmount = '101.00';

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow('totals do not reconcile');

  expect(InvoiceService.createInvoice).not.toHaveBeenCalled();
  expect(Journal.create).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Invoice status failure rolls back before Journal creation', async () => {
  const { transaction, billing } = makeFixture();
  InvoiceService.issueInvoice.mockRejectedValueOnce(new Error('invoice issue failed'));

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow('invoice issue failed');

  expect(Journal.create).not.toHaveBeenCalled();
  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Journal creation failure rolls back Invoice and Billing writes', async () => {
  const { transaction, billing } = makeFixture();
  Journal.create.mockRejectedValueOnce(new Error('journal create failed'));

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow('journal create failed');

  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
  expect(billing.status).toBe('DRAFT');
});

test('Journal posting failure rolls back the issuance transaction', async () => {
  const { transaction, billing, journal } = makeFixture();
  journal.update.mockRejectedValueOnce(new Error('journal posting failed'));

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow('journal posting failed');

  expect(billing.update).not.toHaveBeenCalled();
  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Billing status failure rolls back the posted Journal and Invoice', async () => {
  const { transaction, billing } = makeFixture();
  billing.update.mockRejectedValueOnce(new Error('billing status update failed'));

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow('billing status update failed');

  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});

test('Journal Line failure rolls back the entire Bill issue transaction', async () => {
  const { transaction, billing } = makeFixture();
  JournalLine.create
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(new Error('journal line failure'));

  await expect(billingService.issueBilling(billing.id)).rejects.toThrow('journal line failure');

  expect(JournalLine.create).toHaveBeenCalledTimes(2);
  expect(transaction.commit).not.toHaveBeenCalled();
  expect(transaction.rollback).toHaveBeenCalledTimes(1);
});
