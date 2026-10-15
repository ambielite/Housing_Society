const Joi = require('joi');

const PR_STATUSES = ['DRAFT', 'SUBMITTED', 'QUOTATION', 'APPROVAL', 'APPROVED', 'REJECTED', 'PO_ISSUED', 'CANCELLED'];

const createRequestSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  requestedBy: Joi.string().uuid().required(),
  requestNo: Joi.string().max(50).required(),
  requestedDate: Joi.date().iso().allow(null),
  department: Joi.string().max(100).allow('', null),
  justification: Joi.string().max(2000).allow('', null),
  estimatedAmount: Joi.number().min(0).allow(null),
});

const listRequestsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  status: Joi.string().valid(...PR_STATUSES),
  requestedBy: Joi.string().uuid(),
});

const updateRequestStatusSchema = Joi.object({
  status: Joi.string().valid(...PR_STATUSES).required(),
});

const addRequestLineSchema = Joi.object({
  itemDescription: Joi.string().max(255).required(),
  quantity: Joi.number().positive().required(),
  estimatedUnitCost: Joi.number().min(0).allow(null),
  assetCategoryId: Joi.string().uuid().allow(null),
});

const createRfqSchema = Joi.object({
  purchaseRequestId: Joi.string().uuid().required(),
  rfqNo: Joi.string().max(50).required(),
  issueDate: Joi.date().iso().allow(null),
  dueDate: Joi.date().iso().allow(null),
});

const inviteVendorSchema = Joi.object({
  vendorId: Joi.string().uuid().required(),
});

const submitQuotationSchema = Joi.object({
  rfqId: Joi.string().uuid().required(),
  vendorId: Joi.string().uuid().required(),
  quotationNo: Joi.string().max(50).required(),
  quotationDate: Joi.date().iso().allow(null),
  validUntil: Joi.date().iso().allow(null),
});

const addQuotationLineSchema = Joi.object({
  description: Joi.string().max(255).required(),
  quantity: Joi.number().positive().required(),
  unitPrice: Joi.number().min(0).required(),
  tax: Joi.number().min(0).allow(null),
});

const decideQuotationSchema = Joi.object({
  status: Joi.string().valid('ACCEPTED', 'REJECTED').required(),
});

const addComparisonSchema = Joi.object({
  criterion: Joi.string().max(100).required(),
  vendorId: Joi.string().uuid().required(),
  score: Joi.number().min(0).max(100).allow(null),
  remarks: Joi.string().max(500).allow('', null),
});

module.exports = {
  createRequestSchema,
  listRequestsQuerySchema,
  updateRequestStatusSchema,
  addRequestLineSchema,
  createRfqSchema,
  inviteVendorSchema,
  submitQuotationSchema,
  addQuotationLineSchema,
  decideQuotationSchema,
  addComparisonSchema,
};
