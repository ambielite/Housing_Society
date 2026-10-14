const Joi = require('joi');

const PARKING_TYPES = ['COVERED', 'OPEN', 'MECHANICAL', 'STACK'];
const SLOT_TYPES = [...PARKING_TYPES, 'VISITOR'];
const VEHICLE_TYPES = ['TWO_WHEELER', 'FOUR_WHEELER', 'EV', 'OTHER'];
const ALLOCATION_TYPES = ['OWNER', 'TENANT', 'VISITOR', 'TEMPORARY_RENTAL'];

const createAreaSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  name: Joi.string().max(150).required(),
  parkingType: Joi.string().valid(...PARKING_TYPES).required(),
  zone: Joi.string().max(100).allow('', null),
});

const updateAreaSchema = Joi.object({
  name: Joi.string().max(150),
  parkingType: Joi.string().valid(...PARKING_TYPES),
  zone: Joi.string().max(100).allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
}).min(1);

const createSlotSchema = Joi.object({
  parkingAreaId: Joi.string().uuid().required(),
  slotCode: Joi.string().max(50).required(),
  slotType: Joi.string().valid(...SLOT_TYPES).required(),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
});

const updateSlotSchema = Joi.object({
  slotCode: Joi.string().max(50),
  slotType: Joi.string().valid(...SLOT_TYPES),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
}).min(1);

const listSlotsQuerySchema = Joi.object({
  parkingAreaId: Joi.string().uuid(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
});

const createAllocationSchema = Joi.object({
  slotId: Joi.string().uuid().required(),
  unitId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().allow(null),
  allocationType: Joi.string().valid(...ALLOCATION_TYPES).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
  fee: Joi.number().min(0).allow(null),
});

const listAllocationsQuerySchema = Joi.object({
  slotId: Joi.string().uuid(),
  unitId: Joi.string().uuid(),
  status: Joi.string().valid('ACTIVE', 'EXPIRED', 'CANCELLED'),
});

const endAllocationSchema = Joi.object({
  status: Joi.string().valid('EXPIRED', 'CANCELLED').required(),
  endDate: Joi.date().iso().allow(null),
});

module.exports = {
  createAreaSchema,
  updateAreaSchema,
  createSlotSchema,
  updateSlotSchema,
  listSlotsQuerySchema,
  createAllocationSchema,
  listAllocationsQuerySchema,
  endAllocationSchema,
};
