const express = require('express');
const controller = require('./purchase-orders.controller');
const validate = require('../../common/validate');
const {
  createPOSchema,
  listPOsQuerySchema,
  updatePOStatusSchema,
  addPOLineSchema,
  createGoodsReceiptSchema,
  createInvoiceSchema,
  listInvoicesQuerySchema,
  addInvoiceLineSchema,
  updateInvoiceStatusSchema,
  allocatePaymentSchema,
} = require('./purchase-orders.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Purchase orders
router.get('/', authorize('PURCHASE_ORDER_READ'), validate(listPOsQuerySchema, 'query'), controller.listPOs);
router.post('/', authorize('PURCHASE_ORDER_CREATE'), validate(createPOSchema), controller.createPO);
router.get('/:poId', authorize('PURCHASE_ORDER_READ'), controller.getPO);
router.patch(
  '/:poId/status',
  authorize('PURCHASE_ORDER_UPDATE'),
  validate(updatePOStatusSchema),
  controller.updatePOStatus
);
router.post('/:poId/lines', authorize('PURCHASE_ORDER_UPDATE'), validate(addPOLineSchema), controller.addPOLine);
router.get('/:poId/lines', authorize('PURCHASE_ORDER_READ'), controller.listPOLines);

// Goods receipts
router.post(
  '/goods-receipts',
  authorize('GOODS_RECEIPT_CREATE'),
  validate(createGoodsReceiptSchema),
  controller.createGoodsReceipt
);
router.get('/:poId/goods-receipts', authorize('GOODS_RECEIPT_READ'), controller.listGoodsReceipts);
router.get('/goods-receipts/:receiptId', authorize('GOODS_RECEIPT_READ'), controller.getGoodsReceipt);

module.exports = router;
