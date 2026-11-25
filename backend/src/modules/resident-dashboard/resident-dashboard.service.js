const { query } = require('../../config/db');
const noticesService = require('../notices/notices.service');
const { resolveResidentUnits } = require('../resident-context/residentUnitContext.service');
const ApiError = require('../../common/ApiError');
const amenityBookingsService = require('../amenity-bookings/amenity-bookings.service');

const listSocietyStaff = async (user) => {
  if (!user?.societyId) return [];
  const result = await query(
    `SELECT id, first_name, last_name, mobile_number, photo_path, staff_type
       FROM staff
      WHERE society_id = $1 AND status = 'ACTIVE'
      ORDER BY first_name, last_name`,
    [user.societyId],
  );
  return result.rows.map((staff) => ({
    id: staff.id,
    name: [staff.first_name, staff.last_name].filter(Boolean).join(' '),
    mobileNumber: staff.mobile_number,
    profilePhotoUrl: staff.photo_path,
    staffType: staff.staff_type,
  }));
};

const listResidentNotifications = async (user) => {
  if (!user.societyId) return [];
  await noticesService.processSchedule();
  const result = await query(
    `SELECT notification.id, notification.title, notification.message,
            notification.notification_type, notification.priority,
            notification.reference_type, notification.reference_id, notification.created_at,
            COALESCE(notification.data, '{}'::jsonb) || CASE WHEN notice.id IS NULL THEN '{}'::jsonb ELSE
              jsonb_build_object('scheduledAt', notice.scheduled_at, 'expiresAt', notice.expires_at) END AS data
       FROM notifications notification LEFT JOIN notices notice
         ON notification.reference_type = 'NOTICE' AND notice.id = notification.reference_id
        AND notice.society_id = notification.society_id
      WHERE notification.society_id = $1 AND notification.user_id = $2 AND notification.channel = 'IN_APP'
        AND notification.is_read = false AND notification.status IN ('PENDING', 'SENT', 'DELIVERED')
      ORDER BY notification.created_at DESC LIMIT 50`,
    [user.societyId, user.id],
  );
  return result.rows;
};

const markResidentNotificationRead = async (user, notificationId) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(notificationId)) throw new ApiError(400, 'Invalid notification ID');
  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = now(), updated_at = now()
      WHERE id = $1 AND society_id = $2 AND user_id = $3 AND channel = 'IN_APP' RETURNING id`,
    [notificationId, user.societyId, user.id,],
  );
  if (!result.rows[0]) throw new ApiError(404, 'Notification not found');
  return result.rows[0];
};

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

  const accountResult = await query(
    `SELECT COALESCE(NULLIF(s.photo_path, ''), NULLIF(u.profile_picture_url, '')) AS photo_url
       FROM users u LEFT JOIN security_guards sg ON sg.user_id = u.id
       LEFT JOIN staff s ON s.id = sg.staff_id AND s.staff_type = 'SECURITY_GUARD'
      WHERE u.id = $1 LIMIT 1`,
    [user.id],
  );

  let maintenance = [];
  let upcomingBookings = [];
  if (resident) {
    await amenityBookingsService.syncPaidBookings();
    const invoiceResult = await query(
      `SELECT i.invoice_number, i.billing_period,
              to_char(i.due_date, 'YYYY-MM-DD') AS due_date,
              i.total_amount AS outstanding_amount, i.status, i.description
         FROM invoices i
        WHERE i.unit_id = $1 AND i.society_id = $2 AND i.status = 'ISSUED'
        ORDER BY i.due_date DESC, i.created_at DESC`,
      [unit?.unit_id || null, societyId],
    );
    maintenance = invoiceResult.rows;

    const bookingResult = await query(
      `SELECT a.name AS amenity_name, b.status,
                to_char(sl.slot_date, 'YYYY-MM-DD') AS slot_date,
                sl.start_time, sl.end_time
           FROM amenity_bookings b
           JOIN amenity_slots sl ON sl.id = b.amenity_slot_id
           JOIN amenities a ON a.id = sl.amenity_id
          WHERE a.society_id = $1 AND b.booked_by = $2
            AND b.status IN ('CONFIRMED', 'PENDING_PAYMENT')
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
  await noticesService.processSchedule();
  const [currentNotices, upcomingNotices] = await Promise.all([
    getAllNotices('current'),
    getAllNotices('upcoming'),
  ]);
  const notices = [...currentNotices, ...upcomingNotices];
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
    account: { photoUrl: accountResult.rows[0]?.photo_url || null },
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
      role: resident.role,
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

module.exports = { getDashboard, listResidentNotifications, markResidentNotificationRead, listSocietyStaff };
