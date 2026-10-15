const ApiError = require('../../common/ApiError');
const repository = require('./helpdesk-setup.repository');

// --- SLA policies --------------------------------------------------------------

const createPolicy = (payload) => repository.createPolicy(payload);

const listPolicies = (societyId) => repository.listPolicies(societyId);

const getPolicy = async (id) => {
  const policy = await repository.findPolicyById(id);
  if (!policy) {
    throw new ApiError(404, 'SLA policy not found');
  }
  const escalationRules = await repository.listRulesForPolicy(id);
  return { ...policy, escalationRules };
};

const updatePolicy = async (id, payload) => {
  const policy = await repository.findPolicyById(id);
  if (!policy) {
    throw new ApiError(404, 'SLA policy not found');
  }
  return repository.updatePolicy(id, payload);
};

const deletePolicy = async (id) => {
  const policy = await repository.findPolicyById(id);
  if (!policy) {
    throw new ApiError(404, 'SLA policy not found');
  }
  const deleted = await repository.deletePolicy(id);
  if (!deleted) {
    throw new ApiError(400, 'SLA policy could not be deleted (it may still be referenced by categories/tickets)');
  }
  return deleted;
};

// --- ticket categories -----------------------------------------------------------

const createCategory = async (payload) => {
  if (payload.parentCategoryId) {
    const parent = await repository.findCategoryById(payload.parentCategoryId);
    if (!parent) {
      throw new ApiError(404, 'Parent category not found');
    }
  }
  if (payload.slaPolicyId) {
    const policy = await repository.findPolicyById(payload.slaPolicyId);
    if (!policy) {
      throw new ApiError(404, 'SLA policy not found');
    }
  }
  return repository.createCategory(payload);
};

const listCategories = (query) => repository.listCategories(query);

const getCategory = async (id) => {
  const category = await repository.findCategoryById(id);
  if (!category) {
    throw new ApiError(404, 'Ticket category not found');
  }
  return category;
};

const updateCategory = async (id, payload) => {
  const category = await repository.findCategoryById(id);
  if (!category) {
    throw new ApiError(404, 'Ticket category not found');
  }
  return repository.updateCategory(id, payload);
};

const deleteCategory = async (id) => {
  const category = await repository.findCategoryById(id);
  if (!category) {
    throw new ApiError(404, 'Ticket category not found');
  }
  const deleted = await repository.deleteCategory(id);
  if (!deleted) {
    throw new ApiError(400, 'Category could not be deleted (it may still be referenced by tickets/sub-categories)');
  }
  return deleted;
};

// --- escalation rules --------------------------------------------------------------

const createRule = async (payload) => {
  const policy = await repository.findPolicyById(payload.slaPolicyId);
  if (!policy) {
    throw new ApiError(404, 'SLA policy not found');
  }
  return repository.createRule(payload);
};

const listRulesForPolicy = async (slaPolicyId) => {
  const policy = await repository.findPolicyById(slaPolicyId);
  if (!policy) {
    throw new ApiError(404, 'SLA policy not found');
  }
  return repository.listRulesForPolicy(slaPolicyId);
};

const updateRule = async (id, payload) => {
  const rule = await repository.findRuleById(id);
  if (!rule) {
    throw new ApiError(404, 'Escalation rule not found');
  }
  return repository.updateRule(id, payload);
};

const deleteRule = async (id) => {
  const rule = await repository.findRuleById(id);
  if (!rule) {
    throw new ApiError(404, 'Escalation rule not found');
  }
  return repository.deleteRule(id);
};

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
