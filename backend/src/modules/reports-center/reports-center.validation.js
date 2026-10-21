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

module.exports = {
  reportQuerySchema,
  contractsQuerySchema,
  quotationComparisonQuerySchema,
  dashboardQuerySchema,
};
