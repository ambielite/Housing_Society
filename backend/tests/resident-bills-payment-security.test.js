jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../src/config/database', () => ({
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/resident-finance/residentFinance.service', () => ({
  initiatePayment: jest.fn(),
  verifyRazorpayPayment: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoice.document.service', () => ({}));

const { query } = require('../src/config/db');
const ResidentFinanceService = require('../src/modules/resident-finance/residentFinance.service');
const residentBills = require('../src/modules/resident-bills/resident-bills.service');

const residentA = {
  id: 'resident-a',
  societyId: 'society-1',
  email: 'resident-a@example.test',
};

const contextA = {
  society_id: 'society-1',
  resident_id: 'resident-a',
  unit_id: 'unit-1',
};

const contextRow = () => ({ rows: [contextA] });

beforeEach(() => {
  query.mockReset();
  ResidentFinanceService.initiatePayment.mockReset();
  ResidentFinanceService.verifyRazorpayPayment.mockReset();
});

test('alternate payment initiation delegates to the transactional Resident Finance path', async () => {
  query.mockResolvedValueOnce(contextRow());
  ResidentFinanceService.initiatePayment.mockResolvedValueOnce({
    duplicate: false,
    payment: {
      id: 'payment-a',
      status: 'INITIATED',
      paymentReference: 'pay-a',
      gatewayOrderId: 'order-a',
      amount: '100.00',
      paymentChannel: 'GATEWAY',
      toJSON() {
        return {
          id: this.id,
          status: this.status,
          paymentReference: this.paymentReference,
          gatewayOrderId: this.gatewayOrderId,
          amount: this.amount,
          paymentChannel: this.paymentChannel,
        };
      },
    },
  });

  const result = await residentBills.initiatePayment(residentA, {
    invoiceId: 'invoice-a',
    paymentMethod: 'UPI',
    idempotencyKey: 'key-a',
  });

  expect(ResidentFinanceService.initiatePayment).toHaveBeenCalledWith(residentA, {
    invoiceId: 'invoice-a',
    method: 'UPI',
    idempotencyKey: 'key-a',
    amount: undefined,
    remarks: undefined,
  });
  expect(result.payment.id).toBe('payment-a');
  expect(query.mock.calls.some(([sql]) => /INSERT\s+INTO\s+payments/i.test(sql))).toBe(false);
});

test('payment history is scoped to the authenticated Resident ID, not the shared Unit', async () => {
  query.mockResolvedValueOnce(contextRow()).mockResolvedValueOnce({ rows: [] });

  await residentBills.getPaymentHistory(residentA);

  const [sql, params] = query.mock.calls[1];
  expect(sql).toContain('p.member_id = $2');
  expect(sql).not.toMatch(/p\.unit_id\s*=|i\.unit_id\s*=/i);
  expect(params).toEqual(['society-1', 'resident-a']);
});

test('a Resident cannot cancel another Resident payment', async () => {
  query.mockResolvedValueOnce(contextRow()).mockResolvedValueOnce({ rows: [], rowCount: 0 });

  await expect(
    residentBills.cancelPayment(residentA, 'payment-b', 'cancel')
  ).rejects.toMatchObject({ statusCode: 404 });

  expect(query).toHaveBeenCalledTimes(2);
  expect(query.mock.calls[1][0]).toContain('member_id = $3');
  expect(query.mock.calls[1][1]).toEqual(['payment-b', 'society-1', 'resident-a']);
});

test('a Resident cannot cancel a completed Payment', async () => {
  query.mockResolvedValueOnce(contextRow()).mockResolvedValueOnce({
    rows: [{ id: 'payment-a', status: 'SUCCESS' }],
    rowCount: 1,
  });

  await expect(
    residentBills.cancelPayment(residentA, 'payment-a', 'cancel')
  ).rejects.toMatchObject({ statusCode: 409 });

  expect(query).toHaveBeenCalledTimes(2);
});

test('a Resident cannot retrieve another Resident receipt', async () => {
  query.mockResolvedValueOnce(contextRow()).mockResolvedValueOnce({ rows: [] });

  await expect(
    residentBills.getReceiptDetails(residentA, 'payment-b')
  ).rejects.toMatchObject({ statusCode: 404 });

  expect(query.mock.calls[1][0]).toContain('p.member_id = $3');
  expect(query.mock.calls[1][1]).toEqual(['payment-b', 'society-1', 'resident-a']);
});

test('failed Razorpay verification propagates and does not mark Payment or Invoice successful', async () => {
  query.mockResolvedValueOnce(contextRow()).mockResolvedValueOnce({
    rows: [{ id: 'payment-a', status: 'INITIATED', journal_id: null }],
  });
  ResidentFinanceService.verifyRazorpayPayment.mockRejectedValueOnce(new Error('Razorpay verification failed'));

  await expect(
    residentBills.confirmOnlinePayment(residentA, 'payment-a', {
      razorpay_payment_id: 'txn-1',
      razorpay_order_id: 'order-1',
      razorpay_signature: 'provider-signature',
    })
  ).rejects.toThrow('Razorpay verification failed');

  expect(ResidentFinanceService.verifyRazorpayPayment).toHaveBeenCalledWith(residentA, 'payment-a', {
    razorpay_payment_id: 'txn-1',
    razorpay_order_id: 'order-1',
    razorpay_signature: 'provider-signature',
  });
  expect(query).toHaveBeenCalledTimes(2);
  expect(query.mock.calls.some(([sql]) => /UPDATE\s+(payments|invoices)/i.test(sql))).toBe(false);
});

test('Razorpay-confirmed success is returned through the shared accounting completion path', async () => {
  query.mockResolvedValueOnce(contextRow()).mockResolvedValueOnce({
    rows: [{ id: 'payment-a', status: 'INITIATED', journal_id: null }],
  });
  ResidentFinanceService.verifyRazorpayPayment.mockResolvedValueOnce({
    status: 'SUCCESS', duplicate: false,
    payment: { id: 'payment-a', status: 'SUCCESS', journalId: 'journal-a' },
  });

  const result = await residentBills.confirmOnlinePayment(residentA, 'payment-a', {
    razorpay_payment_id: 'txn-1',
    razorpay_order_id: 'order-1',
    razorpay_signature: 'provider-signature',
  });

  expect(result.status).toBe('SUCCESS');
  expect(result.payment.journalId).toBe('journal-a');
  expect(ResidentFinanceService.verifyRazorpayPayment).toHaveBeenCalledTimes(1);
});
