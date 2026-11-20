const service = require('./residentFinance.service');

const respond = (handler) => async (req, res) => {
  try {
    const data = await handler(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

exports.getDues = respond((req) => service.getDues(req.user));
exports.getPayments = respond((req) => service.getPayments(req.user));
exports.initiatePayment = async (req, res) => {
  try {
    const result = await service.initiatePayment(req.user, req.body);
    const payment = result.payment.toJSON ? result.payment.toJSON() : result.payment;
    payment.checkout = result.payment.checkout || null;
    return res.status(result.duplicate ? 200 : 201).json({
      success: true,
      duplicate: result.duplicate,
      message: result.duplicate
        ? 'Existing payment returned'
        : result.payment.paymentChannel === 'GATEWAY'
          ? 'Payment request recorded and pending provider confirmation'
          : 'Payment request recorded and pending verification',
      data: payment,
    });
  } catch (error) {
    return res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const result = await service.verifyRazorpayPayment(req.user, req.params.paymentId, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

