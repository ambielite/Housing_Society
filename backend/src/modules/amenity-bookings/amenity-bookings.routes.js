const express = require('express');
const controller = require('./amenity-bookings.controller');
const validate = require('../../common/validate');
const {
  createBookingSchema,
  listBookingsQuerySchema,
  confirmBookingSchema,
  addGuestSchema,
} = require('./amenity-bookings.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('AMENITY_BOOKING_READ'), validate(listBookingsQuerySchema, 'query'), controller.listBookings);
router.post('/', authorize('AMENITY_BOOKING_CREATE'), validate(createBookingSchema), controller.createBooking);
router.get('/:bookingId', authorize('AMENITY_BOOKING_READ'), controller.getBooking);
router.patch('/:bookingId/confirm', authorize('AMENITY_BOOKING_UPDATE'), validate(confirmBookingSchema), controller.confirmBooking);
router.patch('/:bookingId/cancel', authorize('AMENITY_BOOKING_UPDATE'), controller.cancelBooking);
router.patch('/:bookingId/no-show', authorize('AMENITY_BOOKING_UPDATE'), controller.markNoShow);
router.delete('/:bookingId', authorize('AMENITY_BOOKING_DELETE'), controller.deleteBooking);

router.post('/:bookingId/guests', authorize('AMENITY_BOOKING_CREATE'), validate(addGuestSchema), controller.addGuest);
router.get('/:bookingId/guests', authorize('AMENITY_BOOKING_READ'), controller.listGuests);

module.exports = router;
