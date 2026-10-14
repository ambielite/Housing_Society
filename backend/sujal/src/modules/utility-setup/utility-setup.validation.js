const Joi = require('joi');

const STATUSES = ['ACTIVE', 'INACTIVE'];
const METER_STATUSES = ['ACTIVE', 'REPLACED', 'DECOMMISSIONED'];

const createTypeSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  code: Joi.string().max(50).required(),
  name: Joi.string().max(150).required(),
  unitOfMeasure: Joi.string().max(20).required(),
});

const listTypesQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  status: Joi.string().valid(...STATUSES),
});

const updateTypeSchema = Joi.object({
  name: Joi.string().max(150),
  unitOfMeasure: Joi.string().max(20),
  status: Joi.string().valid(...STATUSES),
}).min(1);

const createMeterSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  unitId: Joi.string().uuid().allow(null),
  meterNo: Joi.string().max(50).required(),
  utilityTypeId: Joi.string().uuid().required(),
  installationDate: Joi.date().iso().allow(null),
});

const listMetersQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  unitId: Joi.string().uuid(),
  utilityTypeId: Joi.string().uuid(),
  status: Joi.string().valid(...METER_STATUSES),
});

const updateMeterSchema = Joi.object({
  unitId: Joi.string().uuid().allow(null),
  meterNo: Joi.string().max(50),
  installationDate: Joi.date().iso().allow(null),
  status: Joi.string().valid(...METER_STATUSES),
}).min(1);

const replaceMeterSchema = Joi.object({
  newMeterNo: Joi.string().max(50).required(),
  installationDate: Joi.date().iso().allow(null),
});

const createTariffSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  utilityTypeId: Joi.string().uuid().required(),
  slabConfig: Joi.object().required(),
  effectiveFrom: Joi.date().iso().required(),
  effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')).allow(null),
});

const updateTariffSchema = Joi.object({
  slabConfig: Joi.object(),
  effectiveFrom: Joi.date().iso(),
  effectiveTo: Joi.date().iso().allow(null),
}).min(1);

module.exports = {
  createTypeSchema,
  listTypesQuerySchema,
  updateTypeSchema,
  createMeterSchema,
  listMetersQuerySchema,
  updateMeterSchema,
  replaceMeterSchema,
  createTariffSchema,
  updateTariffSchema,
};
