const crypto = require('crypto');
const ApiError = require('../../common/ApiError');
const repository = require('./amenity-bookings.repository');
const amenitiesRepository = require('../amenities/amenities.repository');

// Baseline from the spec: "Pending-payment window; baseline example is 5 minutes."
const PENDING_PAYMENT_WINDOW_MINUTES = 5;

const generateBookingNo = () => `BKG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Resolves the price to charge: an active amenity_pricing_rules entry
 * for this member type + day type + date overrides the slot's own
 * default price. Falls back to the slot's price if no rule matches.
 */
const resolvePrice = async (slot, amenity, { memberType, dayType }) => {
  if (memberType && dayType) {
    const rule = await amenitiesRepository.findApplicablePricingRule(
      amenity.id,
      memberType,
      dayType,
      slot.slot_date
    );
    if (rule) {
      return parseFloat(rule.price);
    }
  }
  return parseFloat(slot.price);
};

/**
 * The core requirement of this phase: "Pessimistic locking or equivalent
 * concurrency control to prevent double booking" + "transaction-safe
 * booking logic." Implemented with a real DB transaction and
 * `SELECT ... FOR UPDATE` on the slot row, so two simultaneous requests
 * for the last remaining spot cannot both succeed - the second request
 * blocks until the first transaction commits/rolls back, then re-reads
 * the now-current occupancy count before deciding.
 */
const createBooking = async ({ amenitySlotId, unitId, bookedBy, guestsCount, memberType, dayType, guests }) => {
  const client = await repository.getClient();
  try {
    await client.query('BEGIN');

    const slot = await amenitiesRepository.findSlotByIdForUpdate(client, amenitySlotId);
    if (!slot) {
      throw new ApiError(404, 'Amenity slot not found');
    }
    if (slot.status === 'BLOCKED' || slot.status === 'CANCELLED') {
      throw new ApiError(400, `This slot is currently ${slot.status} and cannot be booked`);
    }

    const amenity = await amenitiesRepository.findAmenityById(slot.amenity_id);
    if (!amenity) {
      throw new ApiError(404, 'Amenity not found');
    }

    // Reject if this slot's window falls inside an active blockout
    // (covers a blockout added after the slot itself was created).
    const slotStart = new Date(`${slot.slot_date.toISOString().slice(0, 10)}T${slot.start_time}`);
    const slotEnd = new Date(`${slot.slot_date.toISOString().slice(0, 10)}T${slot.end_time}`);
    const overlap = await amenitiesRepository.findOverlappingBlockout(slot.amenity_id, slotStart, slotEnd);
    if (overlap) {
      throw new ApiError(400, 'This slot falls within an active maintenance/event blockout');
    }

    // Check-on-read expiry, scoped to this slot, before counting occupancy.
    await repository.expireStalePendingInTx(client, amenitySlotId, PENDING_PAYMENT_WINDOW_MINUTES);

    const currentOccupancy = await repository.countActiveOccupancyForSlot(client, amenitySlotId);
    const requestedOccupancy = (guestsCount || 0) + 1; // +1 for the booker themselves

    if (currentOccupancy + requestedOccupancy > slot.capacity) {
      throw new ApiError(
        409,
        `This slot cannot fit ${requestedOccupancy} more (${currentOccupancy}/${slot.capacity} already held)`
      );
    }

    const amount = await resolvePrice(slot, amenity, { memberType, dayType });
    const bookingNo = generateBookingNo();

    const booking = await repository.createInTx(client, {
      amenitySlotId,
      unitId,
      bookedBy,
      bookingNo,
      guestsCount,
      amount,
    });

    for (const guest of guests || []) {
      await client.query(
        `INSERT INTO amenity_booking_guests (booking_id, name, phone, id_type, id_number_masked)
         VALUES ($1, $2, $3, $4, $5)`,
        [booking.id, guest.name, guest.phone || null, guest.idType || null, guest.idNumberMasked || null]
      );
    }

    // If this booking fills the slot, flip its status so new attempts
    // see FULL immediately without needing to recompute occupancy.
    if (currentOccupancy + requestedOccupancy >= slot.capacity) {
      await amenitiesRepository.updateSlotStatusInTx(client, amenitySlotId, 'FULL');
    }

    await client.query('COMMIT');
    return booking;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const listBookings = async (query) => {
  await repository.expireStalePending(PENDING_PAYMENT_WINDOW_MINUTES);
  return repository.listBookings(query);
};

const getBooking = async (id) => {
  await repository.expireStalePending(PENDING_PAYMENT_WINDOW_MINUTES);
  const booking = await repository.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  const guests = await repository.listGuests(id);
  return { ...booking, guests };
};

/**
 * Confirms a booking (payment received). Until Phase 7 (Payments) is
 * confirmed live, paymentId is stored as a plain UUID placeholder.
 */
const confirmBooking = async (id, paymentId) => {
  const booking = await repository.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  if (booking.status !== 'PENDING_PAYMENT') {
    throw new ApiError(400, `Cannot confirm a booking that is currently ${booking.status}`);
  }
  return repository.updateStatus(id, 'CONFIRMED', paymentId);
};

/** Cancellation covers both resident-initiated cancellation and maintenance-triggered cancellation. */
const cancelBooking = async (id) => {
  const booking = await repository.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
    throw new ApiError(400, `This booking is already ${booking.status}`);
  }
  const updated = await repository.updateStatus(id, 'CANCELLED');

  // Freeing this booking's spot may un-fill the slot; simplest safe
  // approach is to flip a FULL slot back to AVAILABLE and let the next
  // booking attempt's occupancy count decide for itself.
  const slot = await amenitiesRepository.findSlotById(booking.amenity_slot_id);
  if (slot && slot.status === 'FULL') {
    await amenitiesRepository.updateSlot(slot.id, { status: 'AVAILABLE' });
  }

  return updated;
};

const markNoShow = async (id) => {
  const booking = await repository.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  if (booking.status !== 'CONFIRMED') {
    throw new ApiError(400, 'Only a CONFIRMED booking can be marked as a no-show');
  }
  return repository.updateStatus(id, 'NO_SHOW');
};

const deleteBooking = async (id) => {
  const booking = await repository.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  return repository.deleteBooking(id);
};

const addGuest = async (bookingId, payload) => {
  const booking = await repository.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  return repository.addGuest({ bookingId, ...payload });
};

const listGuests = async (bookingId) => {
  const booking = await repository.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  return repository.listGuests(bookingId);
};

module.exports = {
  createBooking,
  listBookings,
  getBooking,
  confirmBooking,
  cancelBooking,
  markNoShow,
  deleteBooking,
  addGuest,
  listGuests,
};
