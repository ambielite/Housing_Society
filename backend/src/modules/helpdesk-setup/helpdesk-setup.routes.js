const express = require('express');
const controller = require('./helpdesk-setup.controller');
const validate = require('../../common/validate');
const {
  createPolicySchema,
  updatePolicySchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
  createRuleSchema,
  updateRuleSchema,
} = require('./helpdesk-setup.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// SLA policies
router.post('/policies', authorize('SLA_POLICY_CREATE'), validate(createPolicySchema), controller.createPolicy);
router.get('/policies', authorize('SLA_POLICY_READ'), controller.listPolicies);
router.get('/policies/:policyId', authorize('SLA_POLICY_READ'), controller.getPolicy);
router.put('/policies/:policyId', authorize('SLA_POLICY_UPDATE'), validate(updatePolicySchema), controller.updatePolicy);
router.delete('/policies/:policyId', authorize('SLA_POLICY_DELETE'), controller.deletePolicy);
router.get('/policies/:policyId/escalation-rules', authorize('ESCALATION_RULE_READ'), controller.listRulesForPolicy);

// Escalation rules
router.post('/escalation-rules', authorize('ESCALATION_RULE_CREATE'), validate(createRuleSchema), controller.createRule);
router.put(
  '/escalation-rules/:ruleId',
  authorize('ESCALATION_RULE_UPDATE'),
  validate(updateRuleSchema),
  controller.updateRule
);
router.delete('/escalation-rules/:ruleId', authorize('ESCALATION_RULE_DELETE'), controller.deleteRule);

// Ticket categories
router.post('/categories', authorize('TICKET_CATEGORY_CREATE'), validate(createCategorySchema), controller.createCategory);
router.get(
  '/categories',
  authorize('TICKET_CATEGORY_READ'),
  validate(listCategoriesQuerySchema, 'query'),
  controller.listCategories
);
router.get('/categories/:categoryId', authorize('TICKET_CATEGORY_READ'), controller.getCategory);
router.put(
  '/categories/:categoryId',
  authorize('TICKET_CATEGORY_UPDATE'),
  validate(updateCategorySchema),
  controller.updateCategory
);
router.delete('/categories/:categoryId', authorize('TICKET_CATEGORY_DELETE'), controller.deleteCategory);

module.exports = router;
