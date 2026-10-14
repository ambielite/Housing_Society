const Joi = require('joi');

const SOURCES = ['MANUAL', 'BULK', 'DEVICE'];
const READING_STATUSES = ['PENDING', 'SUBMITTED', 'VALIDATED', 'ESTIMATED', 'REJECTED', 'BILLED'];

const submitReadingSchema = Joi.object({
  meterId: Joi.string().uuid().required(),
  readingDate: Joi.date().iso().allow(null),
  readingValue: Joi.number().min(0).required(),
  source: Joi.string().valid(...SOURCES),
  imageDocumentId: Joi.string().uuid().allow(null),
  isRollover: Joi.boolean(),
});

const estimateReadingSchema = Joi.object({
  meterId: Joi.string().uuid().required(),
  readingDate: Joi.date().iso().allow(null),
  readingValue: Joi.number().min(0).required(),
});

const bulkReadingsSchema = Joi.object({
  readings: Joi.array()
    .items(
      Joi.object({
        meterId: Joi.string().uuid().required(),
        readingDate: Joi.date().iso().allow(null),
        readingValue: Joi.number().min(0).required(),
        imageDocumentId: Joi.string().uuid().allow(null),
        isRollover: Joi.boolean(),
      })
    )
    .min(1)
    .max(500)
    .required(),
});

const listReadingsQuerySchema = Joi.object({
  meterId: Joi.string().uuid(),
  status: Joi.string().valid(...READING_STATUSES),
});

const rejectReadingSchema = Joi.object({
  remarks: Joi.string().max(500).allow('', null),
});

const adjustReadingSchema = Joi.object({
  actualValue: Joi.number().min(0).required(),
});

const createBillSchema = Joi.object({
  readingId: Joi.string().uuid().required(),
});

const linkBillSchema = Joi.object({
  billingCycleId: Joi.string().uuid().allow(null),
  invoiceLineId: Joi.string().uuid().allow(null),
}).or('billingCycleId', 'invoiceLineId');

module.exports = {
  submitReadingSchema,
  estimateReadingSchema,
  bulkReadingsSchema,
  listReadingsQuerySchema,
  rejectReadingSchema,
  adjustReadingSchema,
  createBillSchema,
  linkBillSchema,
};
