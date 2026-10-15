const express = require('express');
const controller = require('./purchase-orders.controller');
const validate = require('../../common/validate');
const {
  createInvoiceSchema,
  listInvoicesQuerySchema,
  addInvoiceLineSchema,
  updateInvoiceStatusSchema,
  allocatePaymentSchema,
} = require('./purchase-orders.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('VENDOR_INVOICE_READ'), validate(listInvoicesQuerySchema, 'query'), controller.listInvoices);
router.post('/', authorize('VENDOR_INVOICE_CREATE'), validate(createInvoiceSchema), controller.createInvoice);
router.get('/:invoiceId', authorize('VENDOR_INVOICE_READ'), controller.getInvoice);
router.post(
  '/:invoiceId/lines',
  authorize('VENDOR_INVOICE_CREATE'),
  validate(addInvoiceLineSchema),
  controller.addInvoiceLine
);
router.patch(
  '/:invoiceId/status',
  authorize('VENDOR_INVOICE_UPDATE'),
  validate(updateInvoiceStatusSchema),
  controller.updateInvoiceStatus
);

router.post(
  '/:invoiceId/payments',
  authorize('VENDOR_PAYMENT_CREATE'),
  validate(allocatePaymentSchema),
  controller.allocatePayment
);
router.get('/:invoiceId/payments', authorize('VENDOR_PAYMENT_READ'), controller.listPaymentsForInvoice);

module.exports = router;
