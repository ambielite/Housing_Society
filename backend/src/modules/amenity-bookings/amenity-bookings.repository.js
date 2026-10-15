const { getClient, query } = require('../../config/db');

// --- amenity_bookings ---------------------------------------------------------

const findByBookingNo = async (bookingNo) => {
  const result = await query('SELECT * FROM amenity_bookings WHERE booking_no = $1', [bookingNo]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await query('SELECT * FROM amenity_bookings WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Check-on-read expiry (no background scheduler exists yet - same
 * pattern used everywhere else in this project). Any PENDING_PAYMENT
 * booking older than the configured window is flipped to EXPIRED right
 * before we read/act on booking data, so stale holds never block a slot
 * indefinitely and never count toward occupancy.
 */
const expireStalePending = async (thresholdMinutes) => {
  await query(
    `UPDATE amenity_bookings SET status = 'EXPIRED', updated_at = now()
     WHERE status = 'PENDING_PAYMENT' AND created_at < now() - ($1 || ' minutes')::interval`,
    [thresholdMinutes]
  );
};

/** Same expiry check, but running inside the booking transaction/lock. */
const expireStalePendingInTx = async (client, amenitySlotId, thresholdMinutes) => {
  await client.query(
    `UPDATE amenity_bookings SET status = 'EXPIRED', updated_at = now()
     WHERE amenity_slot_id = $1 AND status = 'PENDING_PAYMENT'
       AND created_at < now() - ($2 || ' minutes')::interval`,
    [amenitySlotId, thresholdMinutes]
  );
};

/** Sum of guests_count + 1 (the booker) across all non-cancelled bookings for a slot, used for capacity checks. */
const countActiveOccupancyForSlot = async (client, amenitySlotId) => {
  const result = await client.query(
    `SELECT COALESCE(SUM(guests_count + 1), 0)::int AS occupied
     FROM amenity_bookings
     WHERE amenity_slot_id = $1 AND status IN ('PENDING_PAYMENT', 'CONFIRMED')`,
    [amenitySlotId]
  );
  return result.rows[0].occupied;
};

const createInTx = async (client, { amenitySlotId, unitId, bookedBy, bookingNo, guestsCount, amount }) => {
  const result = await client.query(
    `INSERT INTO amenity_bookings (amenity_slot_id, unit_id, booked_by, booking_no, guests_count, amount)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [amenitySlotId, unitId, bookedBy, bookingNo, guestsCount || 0, amount || 0]
  );
  return result.rows[0];
};

const listBookings = async ({ amenitySlotId, unitId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (amenitySlotId) {
    conditions.push(`amenity_slot_id = $${idx++}`);
    params.push(amenitySlotId);
  }
  if (unitId) {
    conditions.push(`unit_id = $${idx++}`);
    params.push(unitId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT * FROM amenity_bookings ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateStatus = async (id, status, paymentId) => {
  const result = await query(
    `UPDATE amenity_bookings SET
       status      = $2,
       payment_id  = COALESCE($3, payment_id),
       updated_at  = now()
     WHERE id = $1
     RETURNING *`,
    [id, status, paymentId || null]
  );
  return result.rows[0] || null;
};

const deleteBooking = async (id) => {
  const result = await query('DELETE FROM amenity_bookings WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- amenity_booking_guests -----------------------------------------------------

const addGuest = async ({ bookingId, name, phone, idType, idNumberMasked }) => {
  const result = await query(
    `INSERT INTO amenity_booking_guests (booking_id, name, phone, id_type, id_number_masked)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [bookingId, name, phone || null, idType || null, idNumberMasked || null]
  );
  return result.rows[0];
};

const listGuests = async (bookingId) => {
  const result = await query('SELECT * FROM amenity_booking_guests WHERE booking_id = $1', [bookingId]);
  return result.rows;
};

module.exports = {
  getClient,
  findByBookingNo,
  findById,
  expireStalePending,
  expireStalePendingInTx,
  countActiveOccupancyForSlot,
  createInTx,
  listBookings,
  updateStatus,
  deleteBooking,
  addGuest,
  listGuests,
};
