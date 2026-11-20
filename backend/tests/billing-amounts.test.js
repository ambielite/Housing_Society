jest.mock('../src/config/db', () => ({
  pool: { end: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../src/config/database', () => ({
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/financial/billing/billing.repository', () => ({
  findByBillNumber: jest.fn(),
  findOutstandingByUnit: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../src/modules/financial/billing-config/billingConfig.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../src/modules/financial/ledger-account/ledgerAccount.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../src/modules/financial/account/account.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../src/modules/financial/accounting-period/accountingPeriod.model', () => ({}));
jest.mock('../src/modules/financial/journal/journal.model', () => ({}));
jest.mock('../src/modules/financial/journal/journalLine.model', () => ({}));
jest.mock('../src/modules/financial/invoice/invoice.service', () => ({}));
jest.mock('../src/modules/financial/invoice/invoice.repository', () => ({
  findByBillingId: jest.fn(),
  findById: jest.fn(),
  findOutstandingByUnit: jest.fn(),
  createItem: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.model', () => ({}));
jest.mock('../src/modules/financial/invoice/previousBalance.service', () => ({ hasSourceTable: jest.fn() }));
jest.mock('../src/modules/financial/tax/tax.service', () => ({
  calculateInvoiceTax: jest.fn().mockResolvedValue({ totalTax: 0 }),
}));

const repository = require('../src/modules/financial/billing/billing.repository');
const BillingConfig = require('../src/modules/financial/billing-config/billingConfig.model');
const LedgerAccount = require('../src/modules/financial/ledger-account/ledgerAccount.model');
const Account = require('../src/modules/financial/account/account.model');
const InvoiceRepository = require('../src/modules/financial/invoice/invoice.repository');
const billingService = require('../src/modules/financial/billing/billing.service');

beforeEach(() => {
  jest.clearAllMocks();
  repository.findByBillNumber.mockResolvedValue(null);
});

test.each([
  ['zero balance and penalty', { subtotal: 5000, previousBalance: 0, taxAmount: 0, penaltyAmount: 0 }, 5000],
  ['previous balance is informational only', { subtotal: 5000, previousBalance: 2000, taxAmount: 0, penaltyAmount: 0 }, 5000],
  ['penalty only', { subtotal: 5000, previousBalance: 0, taxAmount: 0, penaltyAmount: 100 }, 5100],
  ['previous balance does not increase charges or penalty', { subtotal: 5000, previousBalance: 2000, taxAmount: 0, penaltyAmount: 100 }, 5100],
  ['tax and fractional cents round once, excluding previous balance', { subtotal: 10.10, previousBalance: 0.20, taxAmount: 0.03, penaltyAmount: 0.07 }, 10.20],
])('payable total includes only payable components: %s', (_label, components, expected) => {
  expect(billingService.calculatePayableTotal(components)).toBe(expected);
});

test('manual Bill calculation persists the same payable components and total', async () => {
  InvoiceRepository.findOutstandingByUnit.mockResolvedValue([
    { outstandingAmount: '1250.25' },
    { outstandingAmount: '749.75' },
  ]);
  LedgerAccount.findOne.mockResolvedValue({ id: 'ledger-a', accountId: 'account-a' });
  Account.findOne.mockResolvedValue({ id: 'account-a', accountType: 'RECEIVABLE' });
  BillingConfig.findOne.mockResolvedValue({
    id: 'rule-a',
    billingModel: 'FLAT_RATE',
    chargeCategory: 'MAINTENANCE',
    code: 'MAINT',
    flatAmount: '5000.00',
  });
  repository.create.mockImplementation(async (record) => record);

  const result = await billingService.createBilling({
    societyId: 'society-a',
    unitId: 'unit-a',
    billingRuleCode: 'MAINT',
    billNumber: 'BILL-TEST',
    billingPeriod: '2026-11',
    billDate: '2026-11-01',
    dueDate: '2026-11-10',
    ledgerAccountId: 'ledger-a',
    taxAmount: 0,
    penaltyAmount: 100,
  });

  expect(result.previousBalance).toBe(2000);
  expect(result.subtotal).toBe(5000);
  expect(result.penaltyAmount).toBe(100);
  expect(result.totalAmount).toBe(5100);
  expect(result.outstandingAmount).toBe(5100);
  expect(result.status).toBe('DRAFT');
});

test('payable total rejects negative or non-finite components', () => {
  expect(() => billingService.calculatePayableTotal({
    subtotal: 100,
    previousBalance: -1,
  })).toThrow('non-negative');
  expect(() => billingService.calculatePayableTotal({
    subtotal: Number.NaN,
  })).toThrow('non-negative');
});
