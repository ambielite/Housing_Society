const Joi = require('joi');

const ENTITY_TYPES = ['PURCHASE_REQUEST', 'PURCHASE_ORDER', 'VENDOR_INVOICE'];

const raiseApprovalSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  entityType: Joi.string().valid(...ENTITY_TYPES).required(),
  entityId: Joi.string().uuid().required(),
  approvalType: Joi.string().max(50).required(),
});

const listRequestsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  entityType: Joi.string().valid(...ENTITY_TYPES),
  entityId: Joi.string().uuid(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUIRED', 'CANCELLED'),
});

const decideSchema = Joi.object({
  decision: Joi.string().valid('APPROVE', 'REJECT', 'INFO_REQUESTED').required(),
  remarks: Joi.string().max(500).allow('', null),
  isFinalLevel: Joi.boolean().default(true),
});

module.exports = { raiseApprovalSchema, listRequestsQuerySchema, decideSchema };
