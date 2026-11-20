const crypto = require('crypto');
const ApiError = require('../../common/ApiError');
const repository = require('./amenity-bookings.repository');
const amenitiesRepository = require('../amenities/amenities.repository');
const invoiceService = require('../financial/invoice/invoice.service');

const generateBookingNo = () => `BKG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const issueBookingInvoice = async (booking, slot, amenity) => {
  if (Number(booking.amount) <= 0) return null;
  const today = await amenitiesRepository.getCurrentDate();
  const result = await invoiceService.createInvoice({
    societyId: amenity.society_id,
    unitId: booking.unit_id,
    invoiceNumber: `AMN-${booking.booking_no}`,
    billingPeriod: `AMENITY-${booking.booking_no}`,
    invoiceDate: today,
    dueDate: today,
    idempotencyKey: `amenity-invoice-${booking.id}`,
    includePreviousBalance: false,
    description: `Amenity booking ${booking.booking_no}`,
    remarks: `Issued automatically for amenity booking on ${slot.slot_date}`,
    items: [{ description: `Amenity reservation ${booking.booking_no}`, quantity: 1, rate: Number(booking.amount), taxRate: 0 }],
  });
  if (result.invoice.status === 'DRAFT') await invoiceService.issueInvoice(result.invoice.id);
  return result.invoice;
};

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

    const { rows: [slotDateCheck] } = await client.query(
      'SELECT $1::date < CURRENT_DATE AS expired',
      [slot.slot_date]
    );
    if (slotDateCheck.expired) {
      throw new ApiError(400, 'This amenity slot has expired and cannot be booked');
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
    await issueBookingInvoice(booking, slot, amenity);
    return booking;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const syncPaidBookings = async () => repository.syncPaidAmenityInvoices();

const listBookings = async (query) => {
  await syncPaidBookings();
  return repository.listBookings(query);
};

const getBooking = async (id) => {
  await syncPaidBookings();
  const booking = await repository.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  const guests = await repository.listGuests(id);
  return { ...booking, guests };
};

const getBookingSocietyId = async (booking) => {
  const slot = await amenitiesRepository.findSlotById(booking.amenity_slot_id);
  if (!slot) throw new ApiError(404, 'Amenity slot not found');
  const amenity = await amenitiesRepository.findAmenityById(slot.amenity_id);
  if (!amenity) throw new ApiError(404, 'Amenity not found');
  return amenity.society_id;
};

const listEligiblePayments = async (id, activeSocietyId) => {
  const booking = await repository.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'PENDING_PAYMENT') {
    throw new ApiError(400, `Payments can only be linked to a pending booking (current status: ${booking.status})`);
  }
  const bookingSocietyId = await getBookingSocietyId(booking);
  if (activeSocietyId && bookingSocietyId !== activeSocietyId) {
    throw new ApiError(404, 'Booking not found');
  }
  if (Number(booking.amount) <= 0) return [];
  return repository.listEligiblePayments({
    bookingId: id,
    societyId: bookingSocietyId,
    unitId: booking.unit_id,
    amount: booking.amount,
  });
};

const createFinancePayment = async (id, activeSocietyId, { paymentMethod, paymentReference }) => {
  const booking = await repository.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'PENDING_PAYMENT') {
    throw new ApiError(400, `A payment can only be recorded for a pending booking (current status: ${booking.status})`);
  }
  if (Number(booking.amount) <= 0) throw new ApiError(400, 'This booking has no payment due');

  const societyId = await getBookingSocietyId(booking);
  if (activeSocietyId && societyId !== activeSocietyId) throw new ApiError(404, 'Booking not found');
  if (!await amenitiesRepository.unitBelongsToSociety(booking.unit_id, societyId)) {
    throw new ApiError(400, 'The booking unit does not belong to the amenity society');
  }

  throw new ApiError(410, 'Amenity invoices are issued automatically when a booking is created. Residents can pay from Maintenance & Payments.');
};

/** Confirm only against a real, successful payment for this society, unit, and booking amount. */
const confirmBooking = async (id, paymentId, activeSocietyId) => {
  const client = await repository.getClient();
  try {
    await client.query('BEGIN');
    const booking = await repository.findByIdForUpdate(client, id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'PENDING_PAYMENT') {
      throw new ApiError(400, `Cannot confirm a booking that is currently ${booking.status}`);
    }
    const bookingSocietyId = await getBookingSocietyId(booking);
    if (activeSocietyId && bookingSocietyId !== activeSocietyId) {
      throw new ApiError(404, 'Booking not found');
    }

    if (paymentId) {
      const paymentResult = await client.query('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [paymentId]);
      const payment = paymentResult.rows[0];
      if (!payment) throw new ApiError(404, 'Payment record not found');
      if (!['SUCCESS', 'VERIFIED'].includes(payment.status)) {
        throw new ApiError(400, 'The selected payment has not been completed or verified');
      }
      if (payment.metadata?.source !== 'AMENITY_BOOKING' || payment.metadata?.amenityBookingId !== id) {
        throw new ApiError(400, 'The selected Finance payment was not created for this booking');
      }
      if (payment.society_id !== bookingSocietyId) {
        throw new ApiError(400, 'The selected payment belongs to a different society');
      }
      if (payment.unit_id !== booking.unit_id) {
        throw new ApiError(400, 'The selected payment belongs to a different unit');
      }
      if (Math.round(Number(payment.amount) * 100) !== amountCents) {
        throw new ApiError(400, 'The payment amount does not match the booking amount');
      }
      const linked = await client.query(
        'SELECT id FROM amenity_bookings WHERE payment_id = $1 AND id <> $2 LIMIT 1',
        [paymentId, id]
      );
      if (linked.rowCount) throw new ApiError(409, 'This payment is already linked to another booking');
    }

    const confirmed = await repository.confirmWithPayment(client, id, paymentId);
    if (!confirmed) throw new ApiError(409, 'The booking was updated by another request. Refresh and try again.');
    await client.query('COMMIT');
    return confirmed;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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

  const slot = await amenitiesRepository.findSlotById(booking.amenity_slot_id);
  const amenity = slot && await amenitiesRepository.findAmenityById(slot.amenity_id);
  if (amenity) {
    const invoice = await issueBookingInvoice(booking, slot, amenity);
    if (invoice && ['ISSUED', 'DRAFT', 'OVERDUE'].includes(invoice.status)) {
      await invoiceService.cancelInvoice(invoice.id);
    }
  }

  // Freeing this booking's spot may un-fill the slot; simplest safe
  // approach is to flip a FULL slot back to AVAILABLE and let the next
  // booking attempt's occupancy count decide for itself.
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
  syncPaidBookings,
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
