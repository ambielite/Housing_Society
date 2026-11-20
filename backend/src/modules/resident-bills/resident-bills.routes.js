const express = require('express');
const { authenticate } = require('../../common/authMiddleware');
const controller = require('./resident-bills.controller');

const router = express.Router();

router.use(authenticate);

router.get('/summary', controller.getSummary);
router.get('/dues', controller.getOutstandingDues);
router.get('/payments', controller.getPaymentHistory);
router.get('/bank-details', controller.getBankDetails);
router.post('/pay', controller.initiatePayment);
router.post('/payments/:id/confirm', controller.confirmPayment);
router.post('/payments/:id/cancel', controller.cancelPayment);
router.get('/invoices/:id/document', controller.downloadInvoiceDocument);
router.get('/payments/:id/receipt', controller.getReceiptDetails);

module.exports = router;

