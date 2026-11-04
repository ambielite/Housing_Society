const ApiError = require('../../common/ApiError');
const { query } = require('../../config/db');
const amenitiesRepository = require('../amenities/amenities.repository');
const bookingsRepository = require('../amenity-bookings/amenity-bookings.repository');
const bookingsService = require('../amenity-bookings/amenity-bookings.service');

const residentContext = async (user) => {
  if (!user.societyId) throw new ApiError(403, 'Your account is not linked to a society');
  const result = await query(
    `SELECT r.id AS resident_id, ou.unit_id
       FROM residents r
       LEFT JOIN owner_units ou
         ON ou.owner_id = r.id AND ou.society_id = r.society_id
        AND ou.status = 'ACTIVE'
        AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
      WHERE r.society_id = $1 AND r.status = 'ACTIVE'
        AND (r.user_id = $2 OR (r.user_id IS NULL AND lower(r.email) = lower($3)))
      ORDER BY ou.effective_from DESC NULLS LAST
      LIMIT 1`,
    [user.societyId, user.id, user.email],
  );
  const resident = result.rows[0];
  if (!resident || !resident.unit_id) {
    throw new ApiError(403, 'Your resident profile is not linked to an active unit');
  }
  return resident;
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
  return bookingsRepository.listBookings({ unitId: resident.unit_id });
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
