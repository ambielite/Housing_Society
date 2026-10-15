const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  societyId: Joi.string().uuid().allow(null),
  status: Joi.string().valid('ACTIVE', 'PENDING', 'SUSPENDED').allow(null),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  societyId: Joi.string().uuid().allow(null),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING').required(),
});

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  societyId: Joi.string().uuid(),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING'),
  search: Joi.string().max(150),
});

module.exports = { createUserSchema, updateProfileSchema, updateStatusSchema, listUsersQuerySchema };
