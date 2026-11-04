const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../../common/authMiddleware');
const validate = require('../../common/validate');
const controller = require('./resident-amenities.controller');

const router = express.Router();
const createBookingSchema = Joi.object({
  amenitySlotId: Joi.string().uuid().required(),
  guestsCount: Joi.number().integer().min(0).default(0),
  guests: Joi.array().items(Joi.object({
    name: Joi.string().max(150).required(),
    phone: Joi.string().max(20).allow('', null),
    idType: Joi.string().max(30).allow('', null),
    idNumberMasked: Joi.string().max(50).allow('', null),
  })).default([]),
});

router.use(authenticate);
router.get('/', controller.listAmenities);
router.get('/bookings', controller.listBookings);
router.post('/bookings', validate(createBookingSchema), controller.createBooking);
router.get('/:amenityId/slots', controller.listSlots);

module.exports = router;
