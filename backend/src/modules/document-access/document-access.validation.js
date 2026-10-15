const Joi = require('joi');

const PERMISSION_TYPES = ['READ', 'DOWNLOAD', 'MANAGE'];
const ENTITY_TYPES = ['VENDOR_CONTRACT', 'TICKET', 'PURCHASE_ORDER', 'VISITOR_PROFILE', 'OTHER'];
const LINK_TYPES = ['ATTACHMENT', 'REFERENCE'];

const grantPermissionSchema = Joi.object({
  documentId: Joi.string().uuid().required(),
  roleId: Joi.string().uuid().allow(null),
  userId: Joi.string().uuid().allow(null),
  permissionType: Joi.string().valid(...PERMISSION_TYPES).required(),
  expiresAt: Joi.date().iso().allow(null),
});

const createLinkSchema = Joi.object({
  documentId: Joi.string().uuid().required(),
  entityType: Joi.string().valid(...ENTITY_TYPES).required(),
  entityId: Joi.string().uuid().required(),
  linkType: Joi.string().valid(...LINK_TYPES),
});

const listLinksForEntityQuerySchema = Joi.object({
  entityType: Joi.string().valid(...ENTITY_TYPES).required(),
  entityId: Joi.string().uuid().required(),
});

module.exports = { grantPermissionSchema, createLinkSchema, listLinksForEntityQuerySchema };
