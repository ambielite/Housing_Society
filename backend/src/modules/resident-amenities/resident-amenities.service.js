const ApiError = require('../../common/ApiError');
const { query } = require('../../config/db');
const { resolveSingleUnit } = require('../resident-context/residentUnitContext.service');
const amenitiesRepository = require('../amenities/amenities.repository');
const bookingsService = require('../amenity-bookings/amenity-bookings.service');

const residentContext = async (user) => {
  if (!user.societyId) throw new ApiError(403, 'Your account is not linked to a society');
  const context = await resolveSingleUnit(user);
  return { resident_id: context.resident.id, unit_id: context.unit.unit_id };
};

const listAmenities = async (user) => {
  await residentContext(user);
  return amenitiesRepository.listAmenities({ societyId: user.societyId, status: 'ACTIVE' });
};

const listSlots = async (user, amenityId) => {
  await residentContext(user);
  const amenity = await amenitiesRepository.findAmenityById(amenityId);
  if (!amenity || amenity.society_id !== user.societyId || amenity.status !== 'ACTIVE') {
    throw new ApiError(404, 'Amenity not found');
  }
  const slots = await query(
    `SELECT id, amenity_id,
            to_char(slot_date, 'YYYY-MM-DD') AS slot_date,
            start_time, end_time, capacity, price, status, created_at, updated_at
       FROM amenity_slots
      WHERE amenity_id = $1
      ORDER BY slot_date ASC, start_time ASC`,
    [amenityId],
  );
  return slots.rows;
};

const listBookings = async (user) => {
  const resident = await residentContext(user);
  return bookingsService.listBookings({ unitId: resident.unit_id });
};

const createBooking = async (user, { amenitySlotId, guestsCount, guests }) => {
  const resident = await residentContext(user);
  const slot = await amenitiesRepository.findSlotById(amenitySlotId);
  if (!slot) throw new ApiError(404, 'Amenity slot not found');
  const amenity = await amenitiesRepository.findAmenityById(slot.amenity_id);
  if (!amenity || amenity.society_id !== user.societyId || amenity.status !== 'ACTIVE') {
    throw new ApiError(404, 'Amenity not found');
  }
  return bookingsService.createBooking({
    amenitySlotId,
    unitId: resident.unit_id,
    bookedBy: user.id,
    guestsCount: guestsCount || 0,
    guests: guests || [],
  });
};

module.exports = { listAmenities, listSlots, listBookings, createBooking };
