const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');
const service = require('./resident-amenities.service');

const listAmenities = asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.listAmenities(req.user), 'Amenities loaded'));

const listSlots = asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.listSlots(req.user, req.params.amenityId), 'Available slots loaded'));

const listBookings = asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.listBookings(req.user), 'Your bookings loaded'));

const createBooking = asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.createBooking(req.user, req.body), 'Amenity booked successfully', 201));

module.exports = { listAmenities, listSlots, listBookings, createBooking };
