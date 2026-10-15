const Joi = require('joi');

const DELIVERY_TYPES = ['COURIER', 'FOOD', 'E_COMMERCE', 'GROCERY', 'OTHER'];
const DELIVERY_STATUSES = ['EXPECTED', 'ARRIVED', 'INSIDE', 'LEFT_AT_GATE', 'PICKED_UP', 'EXITED', 'OVERSTAY', 'CANCELLED'];
const PARCEL_STATUSES = ['COLLECTED', 'DAMAGED', 'LOST'];

const createDeliverySchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  unitId: Joi.string().uuid().required(),
  visitorProfileId: Joi.string().uuid().allow(null),
  deliveryType: Joi.string().valid(...DELIVERY_TYPES).required(),
  courierName: Joi.string().max(100).allow('', null),
  trackingNo: Joi.string().max(100).allow('', null),
});

const listDeliveriesQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  unitId: Joi.string().uuid(),
  status: Joi.string().valid(...DELIVERY_STATUSES),
});

const updateDeliveryStatusSchema = Joi.object({
  status: Joi.string().valid(...DELIVERY_STATUSES).required(),
  receivedAt: Joi.date().iso().allow(null),
  handedOverAt: Joi.date().iso().allow(null),
});

const createParcelSchema = Joi.object({
  deliveryId: Joi.string().uuid().required(),
  parcelCode: Joi.string().max(50).allow('', null),
  storageLocation: Joi.string().max(100).allow('', null),
  receivedBy: Joi.string().uuid().allow(null),
});

const listParcelsQuerySchema = Joi.object({
  deliveryId: Joi.string().uuid(),
  status: Joi.string().valid('STORED', ...PARCEL_STATUSES),
});

const updateParcelStatusSchema = Joi.object({
  status: Joi.string().valid(...PARCEL_STATUSES).required(),
  collectedBy: Joi.string().uuid().allow(null),
});

module.exports = {
  createDeliverySchema,
  listDeliveriesQuerySchema,
  updateDeliveryStatusSchema,
  createParcelSchema,
  listParcelsQuerySchema,
  updateParcelStatusSchema,
};
