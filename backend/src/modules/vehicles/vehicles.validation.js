const Joi = require('joi');

const VEHICLE_TYPES = ['TWO_WHEELER', 'FOUR_WHEELER', 'EV', 'OTHER'];
const VEHICLE_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'SOLD_TRANSFERRED'];
const CREDENTIAL_TYPES = ['RFID', 'STICKER', 'QR'];

const createVehicleSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  ownerUserId: Joi.string().uuid().allow(null),
  unitId: Joi.string().uuid().required(),
  registrationNo: Joi.string()
    .trim()
    .uppercase()
    .replace(/[\s-]+/g, '')
    .min(5)
    .max(13)
    .pattern(/^[A-Z]{2}\d{1,4}[A-Z]{1,3}\d{1,4}$/)
    .custom((value, helpers) => {
      const serial = value.match(/\d+$/)?.[0] || '';
      return /^0+$/.test(serial) ? helpers.error('any.invalid') : value;
    })
    .required()
    .messages({
      'string.empty': 'Vehicle registration number is required.',
      'string.min': 'Vehicle registration number is too short to be valid.',
      'string.max': 'Vehicle registration number is too long to be valid.',
      'string.pattern.base': 'Use the format MH12AB1234: state, RTO, series, then number.',
      'any.invalid': 'The final registration number cannot be all zeros.',
    }),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  make: Joi.string().trim().min(1).max(100).required(),
  model: Joi.string().max(100).allow('', null),
  color: Joi.string().trim().min(1).max(50).required(),
});

const listVehiclesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  societyId: Joi.string().uuid(),
  unitId: Joi.string().uuid(),
  ownerUserId: Joi.string().uuid(),
  status: Joi.string().valid(...VEHICLE_STATUSES),
});

const updateVehicleSchema = Joi.object({
  ownerUserId: Joi.string().uuid().allow(null),
  unitId: Joi.string().uuid(),
  make: Joi.string().trim().min(1).max(100),
  model: Joi.string().max(100).allow('', null),
  color: Joi.string().trim().min(1).max(50),
}).min(1);

const updateVehicleStatusSchema = Joi.object({
  status: Joi.string().valid(...VEHICLE_STATUSES).required(),
});

const assignCredentialSchema = Joi.object({
  credentialType: Joi.string().valid(...CREDENTIAL_TYPES).required(),
  credentialValue: Joi.string().max(100).required(),
  expiresAt: Joi.date().iso().allow(null),
});

const logEntrySchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  slotId: Joi.string().uuid().required(),
  vehicleId: Joi.string().uuid().allow(null),
  visitorId: Joi.string().uuid().allow(null),
}).or('vehicleId', 'visitorId');

const listVisitsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  slotId: Joi.string().uuid(),
  vehicleId: Joi.string().uuid(),
  status: Joi.string().valid('INSIDE', 'EXITED', 'OVERSTAY', 'CANCELLED'),
});

module.exports = {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  assignCredentialSchema,
  logEntrySchema,
  listVisitsQuerySchema,
};
