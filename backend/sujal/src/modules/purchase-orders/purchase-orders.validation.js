const Joi = require('joi');

const PO_STATUSES = ['ISSUED', 'AMENDED', 'RECEIVED', 'BILLED', 'PAID', 'CANCELLED'];
const RECEIPT_STATUSES = ['ACCEPTED', 'PARTIAL', 'REJECTED'];
const INVOICE_STATUSES = ['DRAFT', 'VERIFIED', 'APPROVED', 'PAID', 'CANCELLED'];

const createPOSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  vendorId: Joi.string().uuid().required(),
  purchaseRequestId: Joi.string().uuid().allow(null),
  poNo: Joi.string().max(50).required(),
  poDate: Joi.date().iso().allow(null),
  deliveryDate: Joi.date().iso().allow(null),
});

const listPOsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  vendorId: Joi.string().uuid(),
  status: Joi.string().valid(...PO_STATUSES),
});

const updatePOStatusSchema = Joi.object({
  status: Joi.string().valid(...PO_STATUSES).required(),
});

const addPOLineSchema = Joi.object({
  itemDescription: Joi.string().max(255).required(),
  quantity: Joi.number().positive().required(),
  unitPrice: Joi.number().min(0).required(),
  tax: Joi.number().min(0).allow(null),
  assetCategoryId: Joi.string().uuid().allow(null),
});

const createGoodsReceiptSchema = Joi.object({
  purchaseOrderId: Joi.string().uuid().required(),
  receiptNo: Joi.string().max(50).required(),
  receivedBy: Joi.string().uuid().allow(null),
  status: Joi.string().valid(...RECEIPT_STATUSES).allow(null),
  lines: Joi.array().items(
    Joi.object({
      poLineId: Joi.string().uuid().required(),
      receivedQty: Joi.number().positive().required(),
      acceptedQty: Joi.number().min(0).allow(null),
      rejectedQty: Joi.number().min(0).allow(null),
    })
  ).min(1).required(),
});

const createInvoiceSchema = Joi.object({
  vendorId: Joi.string().uuid().required(),
  purchaseOrderId: Joi.string().uuid().allow(null),
  invoiceNo: Joi.string().max(50).required(),
  invoiceDate: Joi.date().iso().allow(null),
  dueDate: Joi.date().iso().allow(null),
  documentId: Joi.string().uuid().allow(null),
});

const listInvoicesQuerySchema = Joi.object({
  vendorId: Joi.string().uuid(),
  purchaseOrderId: Joi.string().uuid(),
  status: Joi.string().valid(...INVOICE_STATUSES),
});

const addInvoiceLineSchema = Joi.object({
  poLineId: Joi.string().uuid().allow(null),
  description: Joi.string().max(255).required(),
  quantity: Joi.number().positive().allow(null),
  amount: Joi.number().min(0).required(),
  tax: Joi.number().min(0).allow(null),
});

const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid(...INVOICE_STATUSES).required(),
});

const allocatePaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().allow(null),
  allocatedAmount: Joi.number().positive().required(),
});

module.exports = {
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
};
