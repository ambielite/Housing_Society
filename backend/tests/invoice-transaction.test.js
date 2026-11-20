jest.mock('../src/config/db', () => ({
  pool: { end: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../src/config/database', () => ({
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/financial/invoice/invoice.repository', () => ({
  findByIdempotencyKey: jest.fn(),
  findByInvoiceNumber: jest.fn(),
  findByBillingId: jest.fn(),
  findOutstandingByUnit: jest.fn(),
  createInvoice: jest.fn(),
  createItem: jest.fn(),
  createPreviousBalanceSources: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/previousBalance.service', () => ({
  hasSourceTable: jest.fn().mockResolvedValue(true),
  getLivePreviousBalances: jest.fn(),
}));
jest.mock('../src/modules/financial/billing/billing.model', () => ({}));
jest.mock('../src/modules/financial/invoice/invoice.document.service', () => ({}));

const sequelize = require('../src/config/database');
const repository = require('../src/modules/financial/invoice/invoice.repository');
const previousBalanceService = require('../src/modules/financial/invoice/previousBalance.service');
const invoiceService = require('../src/modules/financial/invoice/invoice.service');

const data = {
  societyId: 'society-a',
  unitId: 'unit-a',
  billingId: 'billing-a',
  invoiceNumber: 'INV-BILL-A',
  billingPeriod: '2026-11',
  invoiceDate: '2026-11-01',
  dueDate: '2026-11-10',
  previousBalance: 0,
  penaltyAmount: 0,
  idempotencyKey: 'manual-billing:billing-a',
  items: [{ description: 'Maintenance', quantity: 1, rate: 100 }],
};

const setupRepository = () => {
  repository.findByIdempotencyKey.mockResolvedValue(null);
  repository.findByInvoiceNumber.mockResolvedValue(null);
  repository.findByBillingId.mockResolvedValue(null);
  repository.findOutstandingByUnit.mockResolvedValue([]);
  repository.createInvoice.mockResolvedValue({ id: 'invoice-a' });
  repository.createItem.mockResolvedValue({ id: 'item-a' });
  repository.createPreviousBalanceSources.mockResolvedValue(undefined);
  repository.findById.mockResolvedValue({ id: 'invoice-a', items: [{ id: 'item-a' }] });
};

beforeEach(() => {
  jest.clearAllMocks();
  setupRepository();
});

test('Invoice creation joins the caller transaction without committing it', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, finished: undefined };

  const result = await invoiceService.createInvoice(data, { transaction });

  expect(repository.createInvoice).toHaveBeenCalledWith(
    expect.objectContaining({ billingId: data.billingId, status: 'DRAFT', totalAmount: 100 }),
    transaction
  );
  expect(repository.createItem).toHaveBeenCalledWith(
    expect.objectContaining({ invoiceId: 'invoice-a', description: 'Maintenance' }),
    transaction
  );
  expect(repository.findById).toHaveBeenCalledWith('invoice-a', transaction);
  expect(sequelize.transaction).not.toHaveBeenCalled();
  expect(result.invoice.id).toBe('invoice-a');
  expect(result.duplicate).toBe(false);
});

test('Invoice item failure propagates without committing or rolling back the caller transaction', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, finished: undefined };
  repository.createItem.mockRejectedValueOnce(new Error('item write failed'));

  await expect(invoiceService.createInvoice(data, { transaction })).rejects.toThrow('item write failed');

  expect(sequelize.transaction).not.toHaveBeenCalled();
  expect(transaction.finished).toBeUndefined();
});

test('Previous Balance is retained for display but excluded from payable Invoice Items', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, finished: undefined };
  const componentData = {
    ...data,
    accountingTotals: {
      previousBalance: 2000,
      subtotal: 5000,
      taxAmount: 0,
      penaltyAmount: 100,
    },
    previousBalanceSources: [{
      id: 'source-invoice-a', societyId: 'society-a', unitId: 'unit-a',
      invoiceNumber: 'INV-OLD', status: 'PARTIALLY_PAID', outstandingAmount: 2000,
    }],
    penaltyAmount: 100,
    items: [
      { description: 'Current charges', quantity: 1, rate: 5000 },
      { description: 'Penalty', quantity: 1, rate: 100 },
    ],
  };
  repository.createInvoice.mockResolvedValue({ id: 'invoice-a' });
  repository.findById.mockResolvedValue({ id: 'invoice-a', items: [] });

  await invoiceService.createInvoice(componentData, { transaction });

  expect(repository.createInvoice).toHaveBeenCalledWith(
    expect.objectContaining({
      previousBalance: 2000,
      subtotal: 5000,
      taxAmount: 0,
      penaltyAmount: 100,
      totalAmount: 5100,
    }),
    transaction
  );
  expect(repository.createItem).toHaveBeenCalledTimes(2);
  expect(repository.createItem.mock.calls.map(([item]) => item.totalAmount))
    .toEqual([5000, 100]);
  expect(repository.createPreviousBalanceSources).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'invoice-a' }),
    componentData.previousBalanceSources,
    transaction
  );
});

test('component Invoice creation rejects items that do not reconcile before writing', async () => {
  const componentData = {
    ...data,
    accountingTotals: {
      previousBalance: 2000,
      subtotal: 5000,
      taxAmount: 0,
      penaltyAmount: 100,
    },
    items: [{ description: 'Incomplete line items', quantity: 1, rate: 5000 }],
  };

  await expect(invoiceService.createInvoice(componentData)).rejects.toThrow(
    'Invoice item totals do not reconcile'
  );

  expect(sequelize.transaction).not.toHaveBeenCalled();
  expect(repository.createInvoice).not.toHaveBeenCalled();
});

test('standalone Invoice creation retains ownership of its transaction', async () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: undefined,
    commit: jest.fn(async () => { transaction.finished = 'commit'; }),
    rollback: jest.fn(async () => { transaction.finished = 'rollback'; }),
  };
  sequelize.transaction.mockResolvedValueOnce(transaction);

  await invoiceService.createInvoice({ ...data, billingId: null });

  expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  expect(transaction.commit).toHaveBeenCalledTimes(1);
  expect(transaction.rollback).not.toHaveBeenCalled();
});

test('Admin invoice reads use current referenced source outstanding, not the saved snapshot', async () => {
  const invoice = { id: 'invoice-current', previousBalance: '2000.00', outstandingAmount: '5100.00' };
  repository.findAll.mockResolvedValue([invoice]);
  repository.findById.mockResolvedValue(invoice);
  previousBalanceService.getLivePreviousBalances.mockResolvedValue(new Map([
    ['invoice-current', { amount: 1250, sources: [{ invoiceId: 'invoice-old', outstandingAmount: 1250 }] }],
  ]));

  const listed = await invoiceService.getAll({ societyId: 'society-a' });
  const detail = await invoiceService.getById('invoice-current');

  expect(listed[0]).toMatchObject({ previousBalance: 1250, outstandingAmount: '5100.00' });
  expect(detail).toMatchObject({ previousBalance: 1250, outstandingAmount: '5100.00' });
  expect(previousBalanceService.getLivePreviousBalances).toHaveBeenNthCalledWith(1, [invoice]);
});
