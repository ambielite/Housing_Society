const crypto = require('crypto');

const credentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured.');
    error.status = 503;
    throw error;
  }
  if (!keyId.startsWith('rzp_test_')) {
    const error = new Error('Razorpay Test Mode keys are required for this integration.');
    error.status = 503;
    throw error;
  }
  return { keyId, keySecret };
};

const api = async (path, { method = 'GET', body } = {}) => {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error?.description || 'Razorpay request failed.'), { status: 502 });
  return data;
};

exports.keyId = () => credentials().keyId;
exports.createOrder = (payment) => api('/orders', {
  method: 'POST',
  body: {
    amount: Math.round(Number(payment.amount) * 100),
    currency: 'INR',
    receipt: payment.paymentReference,
    notes: { internal_payment_id: payment.id, invoice_id: payment.invoiceId },
  },
});
exports.fetchPayment = (paymentId) => api(`/payments/${encodeURIComponent(paymentId)}`);
exports.fetchOrder = (orderId) => api(`/orders/${encodeURIComponent(orderId)}`);
exports.fetchOrderPayments = (orderId) => api(`/orders/${encodeURIComponent(orderId)}/payments`);
exports.verifyCheckoutSignature = (orderId, paymentId, signature) => {
  const { keySecret } = credentials();
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest();
  let provided;
  try { provided = Buffer.from(signature, 'hex'); } catch { return false; }
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
};
exports.verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !Buffer.isBuffer(rawBody) || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  let provided;
  try { provided = Buffer.from(signature, 'hex'); } catch { return false; }
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
};
