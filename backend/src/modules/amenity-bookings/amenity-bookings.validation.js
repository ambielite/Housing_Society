const Joi = require('joi');

const MEMBER_TYPES = ['OWNER', 'TENANT'];
const DAY_TYPES = ['PEAK', 'NON_PEAK'];
const BOOKING_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'EXPIRED'];

const guestSchema = Joi.object({
  name: Joi.string().max(150).required(),
  phone: Joi.string().max(20).allow('', null),
  idType: Joi.string().max(30).allow('', null),
  idNumberMasked: Joi.string().max(50).allow('', null),
});

const createBookingSchema = Joi.object({
  amenitySlotId: Joi.string().uuid().required(),
  unitId: Joi.string().uuid().required(),
  bookedBy: Joi.string().uuid().required(),
  guestsCount: Joi.number().integer().min(0).default(0),
  memberType: Joi.string().valid(...MEMBER_TYPES).allow(null),
  dayType: Joi.string().valid(...DAY_TYPES).allow(null),
  guests: Joi.array().items(guestSchema).default([]),
});

const listBookingsQuerySchema = Joi.object({
  amenitySlotId: Joi.string().uuid(),
  unitId: Joi.string().uuid(),
  status: Joi.string().valid(...BOOKING_STATUSES),
});

const confirmBookingSchema = Joi.object({
  paymentId: Joi.string().uuid().allow(null),
});

const createBookingPaymentSchema = Joi.object({
  paymentMethod: Joi.string().valid('CASH', 'CHEQUE', 'NEFT', 'RTGS', 'BANK_TRANSFER').default('CASH'),
  paymentReference: Joi.string().max(100).allow('', null),
});

const addGuestSchema = guestSchema;

module.exports = {
  createBookingSchema,
  listBookingsQuerySchema,
  confirmBookingSchema,
  createBookingPaymentSchema,
  addGuestSchema,
};
