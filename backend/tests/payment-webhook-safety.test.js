const crypto = require('crypto');

jest.mock('../src/config/db', () => ({ pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/config/database', () => ({
  transaction: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/financial/payment/payment.repository', () => ({
  findById: jest.fn(),
  findByIdempotencyKey: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/financial/invoice/invoice.repository', () => ({ lockUnitFinancialScope: jest.fn() }));
jest.mock('../src/modules/financial/billing/billing.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/financial/ledger-account/ledgerAccount.model', () => ({ findByPk: jest.fn() }));
jest.mock('../src/modules/financial/account/account.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/financial/accounting-period/accountingPeriod.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/financial/journal/journal.model', () => ({ create: jest.fn() }));
jest.mock('../src/modules/financial/journal/journalLine.model', () => ({ create: jest.fn() }));

const sequelize = require('../src/config/database');
const PaymentRepository = require('../src/modules/financial/payment/payment.repository');
const PaymentService = require('../src/modules/financial/payment/payment.service');
const Invoice = require('../src/modules/financial/invoice/invoice.model');
const Billing = require('../src/modules/financial/billing/billing.model');
const Account = require('../src/modules/financial/account/account.model');
const AccountingPeriod = require('../src/modules/financial/accounting-period/accountingPeriod.model');
const Journal = require('../src/modules/financial/journal/journal.model');
const JournalLine = require('../src/modules/financial/journal/journalLine.model');
const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET;

const secret = 'unit-test-webhook-secret';
const eventData = {
  paymentId: 'payment-a',
  gatewayOrderId: 'order-a',
  gatewayTransactionId: 'gateway-txn-a',
  amount: 100,
  status: 'FAILED',
};

const sign = (event) => crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify({
    paymentId: event.paymentId,
    gatewayOrderId: event.gatewayOrderId,
    gatewayTransactionId: event.gatewayTransactionId,
    amount: event.amount,
    status: event.status,
  }))
  .digest('hex');

beforeEach(() => {
  jest.clearAllMocks();
  PaymentRepository.findById.mockReset();
  PaymentRepository.findByIdempotencyKey.mockReset();
  PaymentRepository.create.mockReset();
  PaymentRepository.update.mockReset();
  Invoice.findByPk.mockReset();
  Billing.findByPk.mockReset();
  Account.findOne.mockReset();
  AccountingPeriod.findOne.mockReset();
  Journal.create.mockReset();
  JournalLine.create.mockReset();
  sequelize.transaction.mockReset();
  process.env.PAYMENT_WEBHOOK_SECRET = secret;
});

afterAll(() => {
  if (originalSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET;
  else process.env.PAYMENT_WEBHOOK_SECRET = originalSecret;
});

test('invalid provider signature is rejected before payment lookup or updates', async () => {
  await expect(PaymentService.processWebhook({ ...eventData, signature: 'invalid' }))
    .rejects.toThrow();

  expect(PaymentRepository.findById).not.toHaveBeenCalled();
  expect(PaymentRepository.update).not.toHaveBeenCalled();
});

test('online initiation records pending intent without inventing a provider order ID', async () => {
  const payment = {
    id: 'payment-a',
    status: 'INITIATED',
    gatewayOrderId: null,
  };
  PaymentRepository.findByIdempotencyKey.mockResolvedValue(null);
  PaymentRepository.create.mockResolvedValue(payment);

  const result = await PaymentService.initiateOnlinePayment({
    societyId: 'society-a',
    invoiceId: 'invoice-a',
    unitId: 'unit-a',
    memberId: 'resident-a',
    amount: 100,
    idempotencyKey: 'key-a',
  });

  expect(result.payment.status).toBe('INITIATED');
  expect(PaymentRepository.create).toHaveBeenCalledWith(
    expect.objectContaining({
      paymentChannel: 'GATEWAY',
      gatewayOrderId: null,
    })
  );
});

test('provider failure event rechecks the locked row and never downgrades accounted success', async () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: undefined,
    commit: jest.fn(async function commit() { this.finished = 'commit'; }),
    rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
  };
  const initialPayment = {
    ...eventData,
    invoiceId: 'invoice-a',
    societyId: 'society-a',
    paymentChannel: 'GATEWAY',
    journalId: null,
    status: 'INITIATED',
  };
  const completedPayment = {
    ...initialPayment,
    status: 'SUCCESS',
    journalId: 'journal-a',
    gatewayTransactionId: eventData.gatewayTransactionId,
  };
  sequelize.transaction.mockResolvedValueOnce(transaction);
  PaymentRepository.findById
    .mockResolvedValueOnce(initialPayment)
    .mockResolvedValueOnce(completedPayment);

  const result = await PaymentService.processWebhook({
    ...eventData,
    signature: sign(eventData),
  });

  expect(result.duplicate).toBe(true);
  expect(result.payment.status).toBe('SUCCESS');
  expect(transaction.commit).toHaveBeenCalledTimes(1);
  expect(PaymentRepository.update).not.toHaveBeenCalled();
});

test('provider success requires gateway transaction and order references', async () => {
  const withoutOrderId = { ...eventData, gatewayOrderId: null, status: 'SUCCESS' };
  withoutOrderId.signature = sign(withoutOrderId);
  await expect(PaymentService.processWebhook(withoutOrderId)).rejects.toThrow('Gateway order ID is required');
  expect(PaymentRepository.findById).not.toHaveBeenCalled();
});

test('valid provider success completes the existing accounting transaction path', async () => {
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: undefined,
    commit: jest.fn(async function commit() { this.finished = 'commit'; }),
    rollback: jest.fn(async function rollback() { this.finished = 'rollback'; }),
  };
  const payment = {
    id: 'payment-a',
    societyId: 'society-a',
    invoiceId: 'invoice-a',
    unitId: 'unit-a',
    paymentChannel: 'GATEWAY',
    paymentMethod: 'ONLINE',
    gatewayOrderId: 'order-a',
    amount: '100.00',
    status: 'INITIATED',
    journalId: null,
    paymentDate: '2026-11-13',
  };
  const invoice = {
    id: 'invoice-a',
    societyId: 'society-a',
    unitId: 'unit-a',
    billingId: 'billing-a',
    totalAmount: '100.00',
    paidAmount: '0.00',
    outstandingAmount: '100.00',
    status: 'ISSUED',
    update: jest.fn(async function update(values) { Object.assign(this, values); }),
  };
  const billing = {
    id: 'billing-a',
    societyId: 'society-a',
    unitId: 'unit-a',
    totalAmount: '100.00',
    update: jest.fn(async function update(values) { Object.assign(this, values); }),
  };
  const journal = {
    id: 'journal-a',
    status: 'DRAFT',
    save: jest.fn(async function save() {}),
  };
  const event = { ...eventData, status: 'SUCCESS' };
  sequelize.transaction.mockResolvedValueOnce(transaction);
  PaymentRepository.findById.mockResolvedValue(payment);
  PaymentRepository.update.mockImplementation(async (record, values) => Object.assign(record, values));
  Invoice.findByPk.mockResolvedValue(invoice);
  Billing.findByPk.mockResolvedValue(billing);
  AccountingPeriod.findOne.mockResolvedValue({ id: 'period-a' });
  Account.findOne.mockImplementation(async ({ where }) => ({ id: where.accountCode }));
  Journal.create.mockResolvedValue(journal);
  JournalLine.create.mockResolvedValue({});

  const result = await PaymentService.processWebhook({ ...event, signature: sign(event) });

  expect(result.payment.status).toBe('SUCCESS');
  expect(result.payment.journalId).toBe('journal-a');
  expect(JournalLine.create).toHaveBeenCalledTimes(2);
  expect(journal.save).toHaveBeenCalledWith({ transaction });
  expect(invoice.paidAmount).toBe(100);
  expect(invoice.outstandingAmount).toBe(0);
  expect(invoice.status).toBe('PAID');
  expect(billing.paidAmount).toBe(100);
  expect(billing.outstandingAmount).toBe(0);
  expect(billing.status).toBe('PAID');
  expect(PaymentRepository.update).toHaveBeenCalledWith(
    payment,
    expect.objectContaining({ status: 'SUCCESS', journalId: 'journal-a' }),
    transaction
  );
  expect(transaction.commit).toHaveBeenCalledTimes(1);
  expect(transaction.rollback).not.toHaveBeenCalled();
});
