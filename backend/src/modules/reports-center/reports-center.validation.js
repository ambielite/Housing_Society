const Joi = require('joi');

// .raw() keeps the dates as plain 'YYYY-MM-DD' strings for the SQL layer.
const base = {
  societyId: Joi.string().uuid(),
  fromDate: Joi.date().iso().raw(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).raw(),
  format: Joi.string().valid('json', 'csv', 'pdf', 'xlsx').default('json'),
  includeRows: Joi.boolean().default(false),
  limit: Joi.number().integer().min(1).max(5000).default(500),
};

const reportQuerySchema = Joi.object(base);

const contractsQuerySchema = Joi.object({
  societyId: base.societyId,
  format: base.format,
  limit: base.limit,
  expiringInDays: Joi.number().integer().min(1).max(365).default(30),
});

const quotationComparisonQuerySchema = Joi.object({
  societyId: base.societyId,
  rfqId: Joi.string().uuid().required(),
  format: base.format,
});

const dashboardQuerySchema = Joi.object({ societyId: base.societyId });

const reportDataExportSchema = Joi.object({
  societyId: base.societyId,
  reportKey: Joi.string().valid(
    'dashboard', 'parking', 'procurement-summary', 'legacy-executive',
    'finance-dashboard', 'bank-balance', 'collection', 'arrears', 'income-expense',
    'society-operations', 'occupancy', 'residents', 'society-vehicles',
    'legacy-visitors', 'gate-summary', 'staff-summary', 'patrol-summary',
    'approvals-dashboard', 'approval-details', 'approval-status', 'approval-sla', 'approval-payments'
  ).required(),
  format: Joi.string().valid('csv', 'pdf', 'xlsx').required(),
  fromDate: base.fromDate,
  toDate: base.toDate,
  rfqId: base.societyId,
  expiringInDays: Joi.number().integer().min(1).max(365),
  limit: base.limit,
});

module.exports = {
  reportQuerySchema,
  contractsQuerySchema,
  quotationComparisonQuerySchema,
  dashboardQuerySchema,
  reportDataExportSchema,
};
