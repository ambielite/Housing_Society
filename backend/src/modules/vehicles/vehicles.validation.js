const Joi = require('joi');

const VEHICLE_TYPES = ['TWO_WHEELER', 'FOUR_WHEELER', 'EV', 'OTHER'];
const VEHICLE_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'SOLD_TRANSFERRED'];
const CREDENTIAL_TYPES = ['RFID', 'STICKER', 'QR'];

const createVehicleSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  ownerUserId: Joi.string().uuid().allow(null),
  unitId: Joi.string().uuid().allow(null),
  registrationNo: Joi.string().max(20).required(),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  make: Joi.string().max(100).allow('', null),
  model: Joi.string().max(100).allow('', null),
  color: Joi.string().max(50).allow('', null),
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
  unitId: Joi.string().uuid().allow(null),
  make: Joi.string().max(100).allow('', null),
  model: Joi.string().max(100).allow('', null),
  color: Joi.string().max(50).allow('', null),
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
