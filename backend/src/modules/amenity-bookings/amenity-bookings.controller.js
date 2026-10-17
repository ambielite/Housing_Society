const service = require('./amenity-bookings.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

const createBooking = asyncHandler(async (req, res) => {
  const booking = await service.createBooking(req.body);
  return ApiResponse.success(res, booking, 'Amenity booked successfully', 201);
});

const listBookings = asyncHandler(async (req, res) => {
  const bookings = await service.listBookings(req.query);
  return ApiResponse.success(res, bookings);
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await service.getBooking(req.params.bookingId);
  return ApiResponse.success(res, booking);
});

const listEligiblePayments = asyncHandler(async (req, res) => {
  const payments = await service.listEligiblePayments(req.params.bookingId, req.user.societyId);
  return ApiResponse.success(res, payments);
});

const createFinancePayment = asyncHandler(async (req, res) => {
  const payment = await service.createFinancePayment(req.params.bookingId, req.user.societyId, req.body);
  return ApiResponse.success(res, payment, 'Payment recorded in Finance for verification', 201);
});

const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await service.confirmBooking(req.params.bookingId, req.body.paymentId, req.user.societyId);
  return ApiResponse.success(res, booking, 'Booking confirmed successfully');
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await service.cancelBooking(req.params.bookingId);
  return ApiResponse.success(res, booking, 'Booking cancelled successfully');
});

const markNoShow = asyncHandler(async (req, res) => {
  const booking = await service.markNoShow(req.params.bookingId);
  return ApiResponse.success(res, booking, 'Booking marked as no-show');
});

const deleteBooking = asyncHandler(async (req, res) => {
  await service.deleteBooking(req.params.bookingId);
  return ApiResponse.success(res, null, 'Booking deleted successfully');
});

const addGuest = asyncHandler(async (req, res) => {
  const guest = await service.addGuest(req.params.bookingId, req.body);
  return ApiResponse.success(res, guest, 'Guest added successfully', 201);
});

const listGuests = asyncHandler(async (req, res) => {
  const guests = await service.listGuests(req.params.bookingId);
  return ApiResponse.success(res, guests);
});

module.exports = {
  createBooking,
  listBookings,
  getBooking,
  listEligiblePayments,
  createFinancePayment,
  confirmBooking,
  cancelBooking,
  markNoShow,
  deleteBooking,
  addGuest,
  listGuests,
};
