const { query } = require('../../config/db');
const noticesService = require('../notices/notices.service');
const { resolveResidentUnits } = require('../resident-context/residentUnitContext.service');

const getDashboard = async (user) => {
  const societyId = user.societyId;
  if (!societyId) {
    return { society: null, unit: null, maintenance: null, notices: [] };
  }

  const societyResult = await query(
    `SELECT id AS society_id, name AS society_name, currency,
            logo_url AS society_logo_url, address AS society_address,
            email AS society_email, phone AS society_phone
       FROM societies WHERE id = $1`,
    [societyId],
  );
  const home = societyResult.rows[0] || null;
  const residentContext = await resolveResidentUnits(user);
  const resident = residentContext.resident;
  // The dashboard contract exposes one Unit. Prefer physical Occupancy, then
  // the latest eligible relationship, with a stable Unit-ID tie-breaker.
  const unit = residentContext.units[0] || null;

  let maintenance = null;
  let upcomingBookings = [];
  if (resident) {
    const invoiceResult = await query(
      `SELECT i.invoice_number, i.billing_period,
              to_char(i.due_date, 'YYYY-MM-DD') AS due_date,
              i.outstanding_amount, i.status, i.description
         FROM invoices i
        WHERE i.unit_id = $1 AND i.society_id = $2 AND i.outstanding_amount > 0
          AND i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
        ORDER BY i.due_date ASC
        LIMIT 1`,
      [unit?.unit_id || null, societyId],
    );
    maintenance = invoiceResult.rows[0] || null;

    const bookingResult = await query(
      `SELECT a.name AS amenity_name, b.status,
                to_char(sl.slot_date, 'YYYY-MM-DD') AS slot_date,
                sl.start_time, sl.end_time
           FROM amenity_bookings b
           JOIN amenity_slots sl ON sl.id = b.amenity_slot_id
           JOIN amenities a ON a.id = sl.amenity_id
          WHERE a.society_id = $1 AND b.booked_by = $2
            AND (b.status = 'CONFIRMED'
              OR (b.status = 'PENDING_PAYMENT'
                  AND b.created_at >= now() - interval '5 minutes'))
            AND (sl.slot_date > CURRENT_DATE
              OR (sl.slot_date = CURRENT_DATE AND sl.start_time > LOCALTIME))
          ORDER BY sl.slot_date ASC, sl.start_time ASC`,
      [societyId, user.id],
    );
    upcomingBookings = bookingResult.rows;
  }

  const getAllNotices = async (tab) => {
    const firstPage = await noticesService.list(societyId, {
      tab,
      page: 1,
      limit: 100,
    });
    const pageCount = Math.ceil(firstPage.total / firstPage.limit);
    if (pageCount <= 1) return firstPage.rows;
    const remainingPages = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        noticesService.list(societyId, {
          tab,
          page: index + 2,
          limit: firstPage.limit,
        }),
      ),
    );
    return firstPage.rows.concat(...remainingPages.map((page) => page.rows));
  };
  const notices = await getAllNotices('current');
  notices.sort((left, right) => {
    const leftDate = new Date(
      left.posted_at || left.scheduled_at || left.created_at || 0,
    ).getTime();
    const rightDate = new Date(
      right.posted_at || right.scheduled_at || right.created_at || 0,
    ).getTime();
    return rightDate - leftDate;
  });

  return {
    society: home ? {
      id: home.society_id,
      name: home.society_name,
      currency: home.currency,
      logoUrl: home.society_logo_url,
      address: home.society_address,
      email: home.society_email,
      phone: home.society_phone,
    } : null,
    resident: resident ? {
      name: resident.display_name,
      photoUrl: resident.profile_photo,
    } : null,
    unit: unit ? {
      number: unit.unit_number,
      tower: unit.tower_name,
      floor: unit.floor_name,
    } : null,
    maintenance,
    upcomingBookings,
    notices,
  };
};

module.exports = { getDashboard };
