const Joi = require('joi');

const GATE_TYPES = ['MAIN', 'SERVICE', 'EMERGENCY', 'PEDESTRIAN'];
const GATE_STATUSES = ['ACTIVE', 'INACTIVE'];
const GUARD_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const CREDENTIAL_TYPES = ['RFID', 'CARD', 'QR', 'BIOMETRIC'];
const CARD_STATUSES = ['ACTIVE', 'REVOKED', 'EXPIRED'];
const DEVICE_TYPES = ['BOOM_BARRIER', 'QR_SCANNER', 'RFID_READER', 'BIOMETRIC', 'CCTV'];
const DEVICE_STATUSES = ['ONLINE', 'OFFLINE', 'ERROR'];

const createGateSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  name: Joi.string().max(150).required(),
  location: Joi.string().max(255).allow('', null),
  gateType: Joi.string().valid(...GATE_TYPES).required(),
});

const updateGateSchema = Joi.object({
  name: Joi.string().max(150),
  location: Joi.string().max(255).allow('', null),
  gateType: Joi.string().valid(...GATE_TYPES),
  status: Joi.string().valid(...GATE_STATUSES),
}).min(1);

const createGuardSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  employeeCode: Joi.string().max(50).allow('', null),
  agencyVendorId: Joi.string().uuid().allow(null),
});

const listGuardsQuerySchema = Joi.object({
  agencyVendorId: Joi.string().uuid(),
  status: Joi.string().valid(...GUARD_STATUSES),
});

const updateGuardSchema = Joi.object({
  employeeCode: Joi.string().max(50).allow('', null),
  agencyVendorId: Joi.string().uuid().allow(null),
  status: Joi.string().valid(...GUARD_STATUSES),
}).min(1);

const issueAccessCardSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  holderUserId: Joi.string().uuid().required(),
  credentialNo: Joi.string().max(100).required(),
  credentialType: Joi.string().valid(...CREDENTIAL_TYPES).required(),
  validUntil: Joi.date().iso().allow(null),
});

const listAccessCardsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  holderUserId: Joi.string().uuid(),
  status: Joi.string().valid(...CARD_STATUSES),
});

const createGateDeviceSchema = Joi.object({
  gateId: Joi.string().uuid().required(),
  deviceType: Joi.string().valid(...DEVICE_TYPES).required(),
  serialNo: Joi.string().max(100).required(),
  ipAddress: Joi.string().max(64).allow('', null),
});

const updateGateDeviceSchema = Joi.object({
  status: Joi.string().valid(...DEVICE_STATUSES),
  ipAddress: Joi.string().max(64).allow('', null),
  lastSeenAt: Joi.date().iso().allow(null),
}).min(1);

const ingestDeviceEventSchema = Joi.object({
  externalEventId: Joi.string().max(150).allow('', null),
  eventType: Joi.string().max(50).required(),
  payload: Joi.object().unknown(true).allow(null),
});

module.exports = {
  createGateSchema,
  updateGateSchema,
  createGuardSchema,
  listGuardsQuerySchema,
  updateGuardSchema,
  issueAccessCardSchema,
  listAccessCardsQuerySchema,
  createGateDeviceSchema,
  updateGateDeviceSchema,
  ingestDeviceEventSchema,
};
