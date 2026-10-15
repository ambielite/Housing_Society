const Joi = require('joi');

const AMENITY_TYPES = ['CLUBHOUSE', 'POOL', 'GYM', 'PARTY_HALL', 'TENNIS_COURT', 'OTHER'];
const AMENITY_STATUSES = ['ACTIVE', 'INACTIVE'];
const SLOT_STATUSES = ['AVAILABLE', 'FULL', 'BLOCKED', 'CANCELLED'];
const MEMBER_TYPES = ['OWNER', 'TENANT'];
const DAY_TYPES = ['PEAK', 'NON_PEAK'];

const createAmenitySchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  name: Joi.string().max(150).required(),
  amenityType: Joi.string().valid(...AMENITY_TYPES).required(),
  capacity: Joi.number().integer().positive().allow(null),
  location: Joi.string().max(255).allow('', null),
  bookingRequired: Joi.boolean(),
});

const listAmenitiesQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  status: Joi.string().valid(...AMENITY_STATUSES),
});

const updateAmenitySchema = Joi.object({
  name: Joi.string().max(150),
  amenityType: Joi.string().valid(...AMENITY_TYPES),
  capacity: Joi.number().integer().positive().allow(null),
  location: Joi.string().max(255).allow('', null),
  bookingRequired: Joi.boolean(),
  status: Joi.string().valid(...AMENITY_STATUSES),
}).min(1);

const createSlotSchema = Joi.object({
  amenityId: Joi.string().uuid().required(),
  slotDate: Joi.date().iso().required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  capacity: Joi.number().integer().positive().required(),
  price: Joi.number().min(0).allow(null),
});

const listSlotsQuerySchema = Joi.object({
  amenityId: Joi.string().uuid(),
  slotDate: Joi.date().iso(),
  status: Joi.string().valid(...SLOT_STATUSES),
});

const updateSlotSchema = Joi.object({
  startTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/),
  capacity: Joi.number().integer().positive(),
  price: Joi.number().min(0),
  status: Joi.string().valid(...SLOT_STATUSES),
}).min(1);

const createPricingRuleSchema = Joi.object({
  amenityId: Joi.string().uuid().required(),
  memberType: Joi.string().valid(...MEMBER_TYPES).required(),
  dayType: Joi.string().valid(...DAY_TYPES).required(),
  price: Joi.number().min(0).required(),
  effectiveFrom: Joi.date().iso().required(),
  effectiveTo: Joi.date().iso().min(Joi.ref('effectiveFrom')).allow(null),
});

const updatePricingRuleSchema = Joi.object({
  price: Joi.number().min(0),
  effectiveFrom: Joi.date().iso(),
  effectiveTo: Joi.date().iso().allow(null),
}).min(1);

const createBlockoutSchema = Joi.object({
  amenityId: Joi.string().uuid().required(),
  startAt: Joi.date().iso().required(),
  endAt: Joi.date().iso().greater(Joi.ref('startAt')).required(),
  reason: Joi.string().max(255).allow('', null),
});

module.exports = {
  createAmenitySchema,
  listAmenitiesQuerySchema,
  updateAmenitySchema,
  createSlotSchema,
  listSlotsQuerySchema,
  updateSlotSchema,
  createPricingRuleSchema,
  updatePricingRuleSchema,
  createBlockoutSchema,
};
