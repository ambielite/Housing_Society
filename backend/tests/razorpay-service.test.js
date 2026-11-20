const crypto = require('crypto');
const Razorpay = require('../src/modules/resident-finance/razorpay.service');

describe('Razorpay service', () => {
  const originalId = process.env.RAZORPAY_KEY_ID;
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const originalWebhook = process.env.RAZORPAY_WEBHOOK_SECRET;
  afterEach(() => {
    if (originalId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = originalId;
    if (originalSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = originalSecret;
    if (originalWebhook === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhook;
    jest.restoreAllMocks();
  });

  test('verifies checkout signatures with the server key secret', () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_unit';
    process.env.RAZORPAY_KEY_SECRET = 'unit-secret';
    const signature = crypto.createHmac('sha256', 'unit-secret').update('order-1|pay-1').digest('hex');
    expect(Razorpay.verifyCheckoutSignature('order-1', 'pay-1', signature)).toBe(true);
    expect(Razorpay.verifyCheckoutSignature('order-1', 'pay-2', signature)).toBe(false);
  });

  test('verifies webhooks against the raw request bytes', () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'hook-secret';
    const raw = Buffer.from('{"event":"payment.captured"}');
    const signature = crypto.createHmac('sha256', 'hook-secret').update(raw).digest('hex');
    expect(Razorpay.verifyWebhookSignature(raw, signature)).toBe(true);
    expect(Razorpay.verifyWebhookSignature(Buffer.from('{}'), signature)).toBe(false);
  });

  test('requires Razorpay Test Mode credentials', () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_live_not-allowed';
    process.env.RAZORPAY_KEY_SECRET = 'unit-secret';
    expect(() => Razorpay.keyId()).toThrow('Razorpay Test Mode keys are required');
  });
});
