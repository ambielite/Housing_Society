const Joi = require('joi');

const acknowledgeEscalationSchema = Joi.object({}).unknown(false);

module.exports = { acknowledgeEscalationSchema };
