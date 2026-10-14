const service = require('./helpdesk-setup.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- SLA policies ---
const createPolicy = asyncHandler(async (req, res) => {
  const policy = await service.createPolicy(req.body);
  return ApiResponse.success(res, policy, 'SLA policy created successfully', 201);
});

const listPolicies = asyncHandler(async (req, res) => {
  const societyId = req.query.societyId || req.user.societyId;
  const policies = await service.listPolicies(societyId);
  return ApiResponse.success(res, policies);
});

const getPolicy = asyncHandler(async (req, res) => {
  const policy = await service.getPolicy(req.params.policyId);
  return ApiResponse.success(res, policy);
});

const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await service.updatePolicy(req.params.policyId, req.body);
  return ApiResponse.success(res, policy, 'SLA policy updated successfully');
});

const deletePolicy = asyncHandler(async (req, res) => {
  await service.deletePolicy(req.params.policyId);
  return ApiResponse.success(res, null, 'SLA policy deleted successfully');
});

// --- ticket categories ---
const createCategory = asyncHandler(async (req, res) => {
  const category = await service.createCategory(req.body);
  return ApiResponse.success(res, category, 'Ticket category created successfully', 201);
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await service.listCategories(req.query);
  return ApiResponse.success(res, categories);
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await service.getCategory(req.params.categoryId);
  return ApiResponse.success(res, category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await service.updateCategory(req.params.categoryId, req.body);
  return ApiResponse.success(res, category, 'Ticket category updated successfully');
});

const deleteCategory = asyncHandler(async (req, res) => {
  await service.deleteCategory(req.params.categoryId);
  return ApiResponse.success(res, null, 'Ticket category deleted successfully');
});

// --- escalation rules ---
const createRule = asyncHandler(async (req, res) => {
  const rule = await service.createRule(req.body);
  return ApiResponse.success(res, rule, 'Escalation rule created successfully', 201);
});

const listRulesForPolicy = asyncHandler(async (req, res) => {
  const rules = await service.listRulesForPolicy(req.params.policyId);
  return ApiResponse.success(res, rules);
});

const updateRule = asyncHandler(async (req, res) => {
  const rule = await service.updateRule(req.params.ruleId, req.body);
  return ApiResponse.success(res, rule, 'Escalation rule updated successfully');
});

const deleteRule = asyncHandler(async (req, res) => {
  await service.deleteRule(req.params.ruleId);
  return ApiResponse.success(res, null, 'Escalation rule deleted successfully');
});

module.exports = {
  createPolicy,
  listPolicies,
  getPolicy,
  updatePolicy,
  deletePolicy,
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  createRule,
  listRulesForPolicy,
  updateRule,
  deleteRule,
};
