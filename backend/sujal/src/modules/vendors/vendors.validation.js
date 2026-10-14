const Joi = require('joi');

const VENDOR_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED', 'EXPIRED', 'ARCHIVED'];
const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];
const CONTRACT_STATUSES = ['ACTIVE', 'EXPIRED', 'TERMINATED'];

const vendorUserParamsSchema = Joi.object({ vendorId: Joi.string().uuid().required() });
const vendorUserLinkParamsSchema = Joi.object({ vendorId: Joi.string().uuid().required(), userId: Joi.string().uuid().required() });
const linkVendorUserSchema = Joi.object({ userId: Joi.string().uuid().required() });

const createVendorSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().allow(null),
  legalName: Joi.string().max(255).required(),
  tradeName: Joi.string().max(255).allow('', null),
  pan: Joi.string().max(20).allow('', null),
  gstin: Joi.string().max(20).allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  addressId: Joi.string().uuid().allow(null),
});

const listVendorsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  societyId: Joi.string().uuid(),
  status: Joi.string().valid(...VENDOR_STATUSES),
  search: Joi.string().max(150),
});

const updateVendorSchema = Joi.object({
  legalName: Joi.string().max(255),
  tradeName: Joi.string().max(255).allow('', null),
  pan: Joi.string().max(20).allow('', null),
  gstin: Joi.string().max(20).allow('', null),
  contactEmail: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  addressId: Joi.string().uuid().allow(null),
}).min(1);

const updateVendorStatusSchema = Joi.object({
  status: Joi.string().valid(...VENDOR_STATUSES).required(),
});

const addContactSchema = Joi.object({
  name: Joi.string().max(150).required(),
  designation: Joi.string().max(100).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  isPrimary: Joi.boolean(),
});

const addDocumentSchema = Joi.object({
  documentId: Joi.string().uuid().allow(null),
  documentType: Joi.string().max(50).required(),
  expiryDate: Joi.date().iso().allow(null),
});

const verifyDocumentSchema = Joi.object({
  verificationStatus: Joi.string().valid(...VERIFICATION_STATUSES).required(),
});

const addBankAccountSchema = Joi.object({
  bankName: Joi.string().max(150).allow('', null),
  accountNoMasked: Joi.string().max(50).allow('', null),
  ifsc: Joi.string().max(20).allow('', null),
  beneficiaryName: Joi.string().max(150).allow('', null),
});

const addContractSchema = Joi.object({
  contractNo: Joi.string().max(50).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
  value: Joi.number().min(0).allow(null),
  paymentTerms: Joi.string().max(255).allow('', null),
});

const updateContractStatusSchema = Joi.object({
  status: Joi.string().valid(...CONTRACT_STATUSES).required(),
});

module.exports = {
  createVendorSchema,
  linkVendorUserSchema,
  vendorUserParamsSchema,
  vendorUserLinkParamsSchema,
  listVendorsQuerySchema,
  updateVendorSchema,
  updateVendorStatusSchema,
  addContactSchema,
  addDocumentSchema,
  verifyDocumentSchema,
  addBankAccountSchema,
  addContractSchema,
  updateContractStatusSchema,
};
