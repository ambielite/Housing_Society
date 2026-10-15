const Joi = require('joi');

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const POLICY_STATUSES = ['ACTIVE', 'INACTIVE'];
const CATEGORY_STATUSES = ['ACTIVE', 'INACTIVE'];
const THRESHOLD_TYPES = ['WARNING_BEFORE_BREACH', 'AT_BREACH', 'MINUTES_AFTER_BREACH'];

const createPolicySchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  name: Joi.string().max(150).required(),
  responseMinutes: Joi.number().integer().positive().required(),
  resolutionMinutes: Joi.number().integer().positive().required(),
  pauseOnWaiting: Joi.boolean(),
});

const updatePolicySchema = Joi.object({
  name: Joi.string().max(150),
  responseMinutes: Joi.number().integer().positive(),
  resolutionMinutes: Joi.number().integer().positive(),
  pauseOnWaiting: Joi.boolean(),
  status: Joi.string().valid(...POLICY_STATUSES),
}).min(1);

const createCategorySchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  parentCategoryId: Joi.string().uuid().allow(null),
  name: Joi.string().max(150).required(),
  code: Joi.string().max(50).required(),
  defaultPriority: Joi.string().valid(...PRIORITIES),
  slaPolicyId: Joi.string().uuid().allow(null),
});

const listCategoriesQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  status: Joi.string().valid(...CATEGORY_STATUSES),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().max(150),
  defaultPriority: Joi.string().valid(...PRIORITIES),
  slaPolicyId: Joi.string().uuid().allow(null),
  status: Joi.string().valid(...CATEGORY_STATUSES),
}).min(1);

const createRuleSchema = Joi.object({
  slaPolicyId: Joi.string().uuid().required(),
  thresholdType: Joi.string().valid(...THRESHOLD_TYPES).required(),
  thresholdValue: Joi.number().integer().min(0).required(),
  escalationLevel: Joi.number().integer().positive().required(),
  targetRoleId: Joi.string().uuid().required(),
  targetUserId: Joi.string().uuid().allow(null),
});

const updateRuleSchema = Joi.object({
  thresholdType: Joi.string().valid(...THRESHOLD_TYPES),
  thresholdValue: Joi.number().integer().min(0),
  escalationLevel: Joi.number().integer().positive(),
  targetRoleId: Joi.string().uuid(),
  targetUserId: Joi.string().uuid().allow(null),
}).min(1);

module.exports = {
  createPolicySchema,
  updatePolicySchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
  createRuleSchema,
  updateRuleSchema,
};
