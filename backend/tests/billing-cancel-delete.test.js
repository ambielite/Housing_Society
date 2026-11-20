jest.mock('../src/config/database', () => ({ transaction: jest.fn(), close: jest.fn() }));
jest.mock('../src/modules/financial/billing/billing.repository', () => ({ findById: jest.fn(), deleteById: jest.fn(), findIssuedMonthlyMaintenanceDuplicate: jest.fn(), lockMonthlyMaintenanceScope: jest.fn() }));
jest.mock('../src/modules/financial/billing-config/billingConfig.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/financial/ledger-account/ledgerAccount.model', () => ({}));
jest.mock('../src/modules/financial/account/account.model', () => ({}));
jest.mock('../src/modules/financial/accounting-period/accountingPeriod.model', () => ({}));
jest.mock('../src/modules/financial/journal/journal.model', () => ({ findAll: jest.fn() }));
jest.mock('../src/modules/financial/journal/journalLine.model', () => ({}));
jest.mock('../src/modules/financial/invoice/invoice.service', () => ({}));
jest.mock('../src/modules/financial/invoice/invoice.repository', () => ({
  findByBillingId: jest.fn(), findById: jest.fn(), lockUnitFinancialScope: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.model', () => ({}));
jest.mock('../src/modules/financial/invoice/invoiceItem.model', () => ({ destroy: jest.fn() }));
jest.mock('../src/modules/financial/invoice/invoicePreviousBalanceSource.model', () => ({ findOne: jest.fn(), destroy: jest.fn() }));
jest.mock('../src/modules/financial/invoice/previousBalance.service', () => ({}));
jest.mock('../src/modules/financial/tax/tax.service', () => ({}));
jest.mock('../src/modules/financial/payment/payment.model', () => ({ findAll: jest.fn() }));

const sequelize = require('../src/config/database');
const billingRepository = require('../src/modules/financial/billing/billing.repository');
const BillingConfig = require('../src/modules/financial/billing-config/billingConfig.model');
const invoiceRepository = require('../src/modules/financial/invoice/invoice.repository');
const Payment = require('../src/modules/financial/payment/payment.model');
const InvoiceItem = require('../src/modules/financial/invoice/invoiceItem.model');
const InvoicePreviousBalanceSource = require('../src/modules/financial/invoice/invoicePreviousBalanceSource.model');
const Journal = require('../src/modules/financial/journal/journal.model');
const billingService = require('../src/modules/financial/billing/billing.service');

const makeTransaction = () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, finished: null };
  transaction.commit = jest.fn(async () => { transaction.finished = 'commit'; });
  transaction.rollback = jest.fn(async () => { transaction.finished = 'rollback'; });
  return transaction;
};

const makeRecord = (values) => {
  const record = { ...values };
  record.update = jest.fn(async (updates) => { Object.assign(record, updates); return record; });
  return record;
};

const billing = (overrides = {}) => makeRecord({
  id: 'bill-a', societyId: 'society-a', unitId: 'unit-a', billNumber: 'B-1',
  status: 'ISSUED', paidAmount: 0, outstandingAmount: 100, journalId: 'journal-a',
  remarks: null, ...overrides,
});

const invoice = (overrides = {}) => makeRecord({
  id: 'invoice-a', societyId: 'society-a', unitId: 'unit-a', billingId: 'bill-a',
  invoiceNumber: 'INV-B-1', status: 'ISSUED', paidAmount: 0, outstandingAmount: 100,
  journalId: 'journal-a', remarks: null, ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  sequelize.transaction.mockImplementation(async () => makeTransaction());
  invoiceRepository.lockUnitFinancialScope.mockResolvedValue(undefined);
  invoiceRepository.findByBillingId.mockResolvedValue(null);
  invoiceRepository.findById.mockResolvedValue(null);
  Payment.findAll.mockResolvedValue([]);
  Journal.findAll.mockResolvedValue([]);
  InvoiceItem.destroy.mockResolvedValue(0);
  InvoicePreviousBalanceSource.findOne.mockResolvedValue(null);
  InvoicePreviousBalanceSource.destroy.mockResolvedValue(0);
  billingRepository.deleteById.mockResolvedValue(1);
  billingRepository.findIssuedMonthlyMaintenanceDuplicate.mockResolvedValue(null);
  billingRepository.lockMonthlyMaintenanceScope.mockResolvedValue(undefined);
  BillingConfig.findByPk.mockResolvedValue(null);
});

test.each(['FLAT_RATE', 'AREA_BASED', 'HYBRID'])('cancel marks a %s bill without invoice history as cancelled', async (billingModel) => {
  const row = billing({ status: 'DRAFT', billingModel });
  billingRepository.findById.mockResolvedValue(row);

  await billingService.cancelBilling(row.id);

  expect(row.status).toBe('CANCELLED');
  expect(row.outstandingAmount).toBe(0);
  expect(row.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED', outstandingAmount: 0 }), expect.any(Object));
  expect(Journal.findAll).not.toHaveBeenCalled();
});

test('monthly flat rent duplicate is rejected on Create Bill with the required message', async () => {
  const transaction = makeTransaction();
  sequelize.transaction.mockResolvedValue(transaction);
  BillingConfig.findByPk.mockResolvedValue({
    id: 'monthly-maintenance-config', societyId: 'society-a',
    configType: 'BILLING_RULE', code: 'BR-MNT-001',
  });
  billingRepository.findIssuedMonthlyMaintenanceDuplicate.mockResolvedValue({ id: 'existing-bill' });

  await expect(billingService.createBilling({
    societyId: 'society-a', unitId: 'unit-a', memberId: 'resident-a',
    billingConfigId: 'monthly-maintenance-config', billingPeriod: '2026-11',
  })).rejects.toThrow('Monthly Flat Rent bill already exists for this resident for the selected month.');
  expect(billingRepository.lockMonthlyMaintenanceScope).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', memberId: 'resident-a', billingPeriod: '2026-11', transaction,
  }));
  expect(transaction.rollback).toHaveBeenCalled();
});

test.each(['FLAT_RATE', 'AREA_BASED', 'HYBRID'])('cancel updates the linked %s invoice and reverses its posted bill journal', async (billingModel) => {
  const row = billing({ billingModel });
  const linkedInvoice = invoice();
  const journal = makeRecord({ id: 'journal-a', status: 'POSTED' });
  billingRepository.findById.mockResolvedValue(row);
  invoiceRepository.findByBillingId.mockResolvedValue(linkedInvoice);
  invoiceRepository.findById.mockResolvedValue(linkedInvoice);
  Journal.findAll.mockResolvedValue([journal]);

  await billingService.cancelBilling(row.id);

  expect(linkedInvoice.status).toBe('CANCELLED');
  expect(linkedInvoice.outstandingAmount).toBe(0);
  expect(row.status).toBe('CANCELLED');
  expect(row.outstandingAmount).toBe(0);
  expect(journal.status).toBe('REVERSED');
  expect(journal.update).toHaveBeenCalledWith({ status: 'REVERSED' }, expect.any(Object));
});

test('cancel records an offline pending payment as cancelled without deleting it', async () => {
  const row = billing();
  const linkedInvoice = invoice();
  const pendingPayment = makeRecord({ status: 'VERIFICATION_PENDING', paymentChannel: 'OFFLINE', remarks: null });
  const journal = makeRecord({ id: 'journal-a', status: 'POSTED' });
  billingRepository.findById.mockResolvedValue(row);
  invoiceRepository.findByBillingId.mockResolvedValue(linkedInvoice);
  invoiceRepository.findById.mockResolvedValue(linkedInvoice);
  Payment.findAll.mockResolvedValue([pendingPayment]);
  Journal.findAll.mockResolvedValue([journal]);

  await billingService.cancelBilling(row.id);

  expect(pendingPayment.status).toBe('CANCELLED');
  expect(pendingPayment.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }), expect.any(Object));
  expect(Payment.findAll).toHaveBeenCalled();
});

test('cancel refuses an in-flight gateway payment and rolls back without altering the bill', async () => {
  const row = billing();
  const linkedInvoice = invoice();
  const gatewayPayment = makeRecord({ status: 'INITIATED', paymentChannel: 'GATEWAY' });
  billingRepository.findById.mockResolvedValue(row);
  invoiceRepository.findByBillingId.mockResolvedValue(linkedInvoice);
  invoiceRepository.findById.mockResolvedValue(linkedInvoice);
  Payment.findAll.mockResolvedValue([gatewayPayment]);

  await expect(billingService.cancelBilling(row.id)).rejects.toThrow(/gateway payment is still in progress/i);

  expect(row.status).toBe('ISSUED');
  expect(linkedInvoice.status).toBe('ISSUED');
  expect(gatewayPayment.status).toBe('INITIATED');
  expect(gatewayPayment.update).not.toHaveBeenCalled();
});

test.each(['SUCCESS', 'VERIFIED', 'REFUNDED'])('cancel preserves a %s payment transaction', async (status) => {
  const row = billing();
  const linkedInvoice = invoice();
  const completedPayment = makeRecord({ status, paymentChannel: 'GATEWAY', journalId: 'payment-journal' });
  billingRepository.findById.mockResolvedValue(row);
  invoiceRepository.findByBillingId.mockResolvedValue(linkedInvoice);
  invoiceRepository.findById.mockResolvedValue(linkedInvoice);
  Payment.findAll.mockResolvedValue([completedPayment]);

  await expect(billingService.cancelBilling(row.id)).rejects.toThrow(/completed payment cannot be cancelled/i);

  expect(completedPayment.status).toBe(status);
  expect(completedPayment.update).not.toHaveBeenCalled();
  expect(row.status).toBe('ISSUED');
  expect(linkedInvoice.status).toBe('ISSUED');
});

test('cancel refuses paid bills without changing invoice or payment history', async () => {
  const row = billing({ status: 'PAID', paidAmount: 100, outstandingAmount: 0 });
  const linkedInvoice = invoice({ status: 'PAID', paidAmount: 100, outstandingAmount: 0 });
  billingRepository.findById.mockResolvedValue(row);
  invoiceRepository.findByBillingId.mockResolvedValue(linkedInvoice);
  invoiceRepository.findById.mockResolvedValue(linkedInvoice);

  await expect(billingService.cancelBilling(row.id)).rejects.toThrow(/paid billing cannot be cancelled/i);
  expect(row.status).toBe('PAID');
  expect(Payment.findAll).toHaveBeenCalled();
});

test('delete removes a cancelled bill transactionally when no invoice is linked', async () => {
  const row = billing({ status: 'CANCELLED', journalId: null });
  billingRepository.findById.mockResolvedValue(row);

  await expect(billingService.deleteBilling(row.id)).resolves.toEqual({ message: 'Billing deleted successfully' });
  expect(billingRepository.deleteById).toHaveBeenCalledWith(row.id, expect.any(Object));
});

test('delete refuses bills until cancelled and preserves payment or accounting history', async () => {
  billingRepository.findById.mockResolvedValue(billing({ status: 'ISSUED' }));
  await expect(billingService.deleteBilling('bill-a')).rejects.toThrow(/only cancelled billing can be deleted/i);
  billingRepository.findById.mockResolvedValue(billing({ status: 'CANCELLED' }));
  invoiceRepository.findByBillingId.mockResolvedValue(invoice());
  Journal.findAll.mockResolvedValue([makeRecord({ id: 'journal-a' })]);
  await expect(billingService.deleteBilling('bill-a')).rejects.toThrow(/posted accounting history cannot be deleted/i);
  expect(InvoiceItem.destroy).not.toHaveBeenCalled();
  expect(billingRepository.deleteById).not.toHaveBeenCalled();
});

test('delete removes a cancelled invoice when history is safely retained', async () => {
  const row = billing({ status: 'CANCELLED', journalId: null });
  const linked = invoice({ status: 'CANCELLED', journalId: null });
  linked.destroy = jest.fn(async () => {});
  billingRepository.findById.mockResolvedValue(row);
  invoiceRepository.findByBillingId.mockResolvedValue(linked);
  await expect(billingService.deleteBilling(row.id)).resolves.toEqual({ message: 'Billing deleted successfully' });
  expect(InvoiceItem.destroy).toHaveBeenCalledWith({ where: { invoiceId: linked.id }, transaction: expect.any(Object) });
  expect(InvoicePreviousBalanceSource.destroy).toHaveBeenCalledWith({ where: { statementInvoiceId: linked.id }, transaction: expect.any(Object) });
  expect(linked.destroy).toHaveBeenCalledWith({ transaction: expect.any(Object) });
  expect(billingRepository.deleteById).toHaveBeenCalledWith(row.id, expect.any(Object));
});
