jest.mock('../src/config/database', () => ({
  close: jest.fn().mockResolvedValue(undefined),
  transaction: jest.fn().mockResolvedValue({
    LOCK: { UPDATE: 'UPDATE' },
    finished: false,
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('../src/config/db', () => ({ pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/modules/residents/resident/resident.model', () => ({ findOne: jest.fn() }));
jest.mock('../src/modules/residents/owner-unit/ownerUnit.model', () => ({ findAll: jest.fn() }));
jest.mock('../src/modules/move-InOut/occupancy/occupancy.model', () => ({ findAll: jest.fn() }));
jest.mock('../src/modules/financial/invoice/invoice.model', () => ({ findAll: jest.fn(), findOne: jest.fn() }));
jest.mock('../src/modules/financial/invoice/invoiceItem.model', () => ({}));
jest.mock('../src/modules/financial/payment/payment.model', () => ({ findAll: jest.fn(), findOne: jest.fn() }));
jest.mock('../src/modules/financial/invoice/previousBalance.service', () => ({
  getLivePreviousBalances: jest.fn().mockResolvedValue(new Map()),
}));
jest.mock('../src/modules/resident-finance/razorpay.service', () => ({
  verifyCheckoutSignature: jest.fn(), fetchPayment: jest.fn(), fetchOrder: jest.fn(),
}));

const { Op } = require('sequelize');
const Resident = require('../src/modules/residents/resident/resident.model');
const OwnerUnit = require('../src/modules/residents/owner-unit/ownerUnit.model');
const Occupancy = require('../src/modules/move-InOut/occupancy/occupancy.model');
const Invoice = require('../src/modules/financial/invoice/invoice.model');
const Payment = require('../src/modules/financial/payment/payment.model');
const PreviousBalanceService = require('../src/modules/financial/invoice/previousBalance.service');
const Razorpay = require('../src/modules/resident-finance/razorpay.service');
const ResidentFinance = require('../src/modules/resident-finance/residentFinance.service');

const user = { id: 'user-a', societyId: 'society-a' };
const invoice = (id, unitId, invoiceDate, extra = {}) => ({
  id, unitId, invoiceDate, societyId: 'society-a', status: 'ISSUED',
  outstandingAmount: 5900, previousBalance: 1200, memberId: null,
  invoiceNumber: `INV-${id}`, toJSON() { return { ...this }; }, ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  Resident.findOne.mockResolvedValue({ id: 'resident-a' });
  OwnerUnit.findAll.mockResolvedValue([]);
  Occupancy.findAll.mockResolvedValue([{
    unitId: 'unit-a', societyId: 'society-a', residentId: 'resident-a',
    startDate: '2026-01-01', billingStartDate: '2026-01-01',
    endDate: null, billingEndDate: null, isCurrent: true,
  }]);
  Invoice.findAll.mockResolvedValue([]);
  Invoice.findOne.mockResolvedValue(null);
  Payment.findAll.mockResolvedValue([]);
  Payment.findOne.mockResolvedValue(null);
});

test('new resident sees only same-unit invoices dated in their billing responsibility period', async () => {
  Invoice.findAll.mockResolvedValue([
    invoice('old-unit-a', 'unit-a', '2025-12-31'),
    invoice('new-unit-a', 'unit-a', '2026-01-01'),
    invoice('other-unit', 'unit-b', '2026-01-15'),
  ]);

  const dues = await ResidentFinance.getDues(user);

  expect(dues.map((row) => row.id)).toEqual(['new-unit-a']);
  expect(Invoice.findAll.mock.calls[0][0].where.societyId).toBe('society-a');
});

test('historical co-owner relationship grants access only during its effective dates', async () => {
  OwnerUnit.findAll.mockResolvedValue([{
    unitId: 'unit-a', societyId: 'society-a', ownerId: 'resident-a',
    status: 'INACTIVE', effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31',
    ownershipType: 'CO_OWNER',
  }]);
  Occupancy.findAll.mockResolvedValue([]);
  Invoice.findAll.mockResolvedValue([
    invoice('co-owner-valid', 'unit-a', '2025-06-01'),
    invoice('co-owner-expired', 'unit-a', '2026-01-01'),
  ]);

  const dues = await ResidentFinance.getDues(user);

  expect(dues.map((row) => row.id)).toEqual(['co-owner-valid']);
});

test('expired occupancy is limited by billing end date and inactive undated links grant no access', async () => {
  Occupancy.findAll.mockResolvedValue([{
    unitId: 'unit-a', societyId: 'society-a', residentId: 'resident-a',
    startDate: '2025-01-01', billingStartDate: '2025-02-01',
    endDate: '2025-12-31', billingEndDate: '2025-11-30', isCurrent: false,
  }, {
    unitId: 'unit-b', startDate: '2024-01-01', isCurrent: false,
    endDate: null, billingEndDate: null,
  }]);
  Invoice.findAll.mockResolvedValue([
    invoice('within-billing-window', 'unit-a', '2025-11-30'),
    invoice('after-billing-window', 'unit-a', '2025-12-01'),
    invoice('inactive-link', 'unit-b', '2025-06-01'),
  ]);

  const dues = await ResidentFinance.getDues(user);

  expect(dues.map((row) => row.id)).toEqual(['within-billing-window']);
});

test('unit payment history includes only this resident’s payments and authorized invoice numbers', async () => {
  Invoice.findAll.mockResolvedValue([
    invoice('current-invoice', 'unit-a', '2026-01-05'),
  ]);
  Payment.findAll.mockResolvedValue([{
    invoiceId: 'current-invoice', toJSON: () => ({ invoiceId: 'current-invoice', amount: 100 }),
  }]);

  const history = await ResidentFinance.getPayments(user);

  expect(history).toEqual([expect.objectContaining({ invoiceNumber: 'INV-current-invoice' })]);
  expect(Payment.findAll).toHaveBeenCalledWith(expect.objectContaining({
    where: { societyId: 'society-a', memberId: 'resident-a' },
  }));
});

test('resident payment history remains available when no current invoice is eligible', async () => {
  Invoice.findAll.mockResolvedValue([]);
  Payment.findAll.mockResolvedValue([{
    invoiceId: 'old-invoice', toJSON: () => ({ invoiceId: 'old-invoice', amount: 250 }),
  }]);

  const history = await ResidentFinance.getPayments(user);

  expect(history).toEqual([expect.objectContaining({ invoiceId: 'old-invoice', invoiceNumber: null })]);
  expect(Payment.findAll).toHaveBeenCalledWith(expect.objectContaining({
    where: { societyId: 'society-a', memberId: 'resident-a' },
  }));
});

test('previous resident balances are not exposed as current resident dues or source details', async () => {
  const current = invoice('current', 'unit-a', '2026-01-05');
  Invoice.findAll.mockResolvedValue([current]);
  PreviousBalanceService.getLivePreviousBalances.mockResolvedValue(new Map([['current', {
    amount: 1200,
    sources: [{ invoiceId: 'previous-resident-invoice', outstandingAmount: 1200 }],
  }]]));

  const dues = await ResidentFinance.getDues(user);

  expect(dues[0].previousBalance).toBe(0);
  expect(dues[0].previousBalanceSources).toEqual([]);
});

test('payment verification rejects an invoice outside the resident responsibility window', async () => {
  Payment.findOne.mockResolvedValue({
    id: 'payment-a', invoiceId: 'old-invoice', status: 'INITIATED',
    memberId: 'resident-a', paymentChannel: 'GATEWAY',
  });
  Invoice.findOne.mockResolvedValue(invoice('old-invoice', 'unit-a', '2025-12-31'));

  await expect(ResidentFinance.verifyRazorpayPayment(user, 'payment-a', {}))
    .rejects.toMatchObject({ status: 404 });
  expect(Razorpay.verifyCheckoutSignature).not.toHaveBeenCalled();
});

test('payment verification lookup remains scoped to the authenticated society', async () => {
  await expect(ResidentFinance.verifyRazorpayPayment(user, 'payment-from-other-society', {}))
    .rejects.toMatchObject({ status: 404 });
  expect(Payment.findOne.mock.calls[0][0].where).toEqual({
    id: 'payment-from-other-society',
    societyId: 'society-a',
    memberId: 'resident-a',
    paymentChannel: 'GATEWAY',
  });
  expect(Invoice.findOne).not.toHaveBeenCalled();
});

test('payment initiation rejects a different unit invoice even within the same society', async () => {
  Invoice.findOne.mockResolvedValue(invoice('other-unit-invoice', 'unit-b', '2026-01-15'));

  await expect(ResidentFinance.initiatePayment(user, {
    invoiceId: 'other-unit-invoice', method: 'UPI', idempotencyKey: 'key-a',
  })).rejects.toMatchObject({ status: 404 });
  expect(Invoice.findOne.mock.calls[0][0].where).toEqual({
    id: 'other-unit-invoice', societyId: 'society-a',
  });
});

test('invoice lookups preserve society scoping and include legitimate unit/co-owner candidates', async () => {
  OwnerUnit.findAll.mockResolvedValue([{
    unitId: 'unit-b', societyId: 'society-a', ownerId: 'resident-a',
    status: 'ACTIVE', effectiveFrom: '2025-01-01', effectiveTo: null,
    ownershipType: 'CO_OWNER',
  }]);
  Invoice.findAll.mockResolvedValue([
    invoice('unit-a-invoice', 'unit-a', '2026-01-05'),
    invoice('unit-b-invoice', 'unit-b', '2026-01-05'),
  ]);

  await ResidentFinance.getDues(user);

  const where = Invoice.findAll.mock.calls[0][0].where;
  expect(where.societyId).toBe('society-a');
  expect(where[Op.or]).toEqual(expect.arrayContaining([
    { memberId: 'resident-a' },
    { unitId: { [Op.in]: ['unit-b', 'unit-a'] } },
  ]));
});
