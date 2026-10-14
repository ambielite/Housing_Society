const Joi = require('joi');

const createRoleSchema = Joi.object({
  name: Joi.string().max(100).required(),
  code: Joi.string().max(50).pattern(/^[A-Za-z_]+$/).required()
    .messages({ 'string.pattern.base': 'code must contain only letters and underscores' }),
  description: Joi.string().max(255).allow('', null),
  societyId: Joi.string().uuid().allow(null),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().max(255).allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
}).min(1);

const assignPermissionSchema = Joi.object({
  permissionCode: Joi.string().max(100).required(),
});

const assignRoleToUserSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  roleCode: Joi.string().max(50).required(),
  societyId: Joi.string().uuid().allow(null),
});

module.exports = { createRoleSchema, updateRoleSchema, assignPermissionSchema, assignRoleToUserSchema };
