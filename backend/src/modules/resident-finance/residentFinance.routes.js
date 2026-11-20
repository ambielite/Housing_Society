const express = require('express');
const { authenticate } = require('../../common/authMiddleware');
const controller = require('./residentFinance.controller');

const router = express.Router();
router.use(authenticate, (req, res, next) => {
  if (!req.user.roles.includes('RESIDENT_APP')) {
    return res.status(403).json({ success: false, message: 'Resident access required' });
  }
  next();
});
router.get('/dues', controller.getDues);
router.get('/payments', controller.getPayments);
router.post('/payments', controller.initiatePayment);
router.post('/payments/:paymentId/verify-razorpay', controller.verifyRazorpayPayment);

module.exports = router;
