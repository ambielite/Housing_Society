const { query } = require('../../config/db');
const noticesService = require('../notices/notices.service');
const ApiError = require('../../common/ApiError');

const listResidentNotifications = async (user) => {
  if (!user.societyId) return [];
  // Catch up scheduled meetings when the resident opens or refreshes the bell,
  // even if the background scheduler was delayed or the app missed its event.
  await noticesService.processSchedule();
  const result = await query(
    `SELECT notification.id, notification.title, notification.message,
            notification.notification_type, notification.priority,
            notification.reference_type, notification.reference_id, notification.created_at,
            COALESCE(notification.data, '{}'::jsonb) ||
              CASE WHEN notice.id IS NULL THEN '{}'::jsonb ELSE
                jsonb_build_object('scheduledAt', notice.scheduled_at, 'expiresAt', notice.expires_at)
              END AS data
       FROM notifications notification
       LEFT JOIN notices notice
         ON notification.reference_type = 'NOTICE'
        AND notice.id = notification.reference_id
        AND notice.society_id = notification.society_id
      WHERE notification.society_id = $1 AND notification.user_id = $2 AND notification.channel = 'IN_APP'
        AND notification.is_read = false AND notification.status IN ('PENDING', 'SENT', 'DELIVERED')
      ORDER BY notification.created_at DESC
      LIMIT 50`,
    [user.societyId, user.id],
  );
  return result.rows;
};

const markResidentNotificationRead = async (user, notificationId) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(notificationId)) {
    throw new ApiError(400, 'Invalid notification ID');
  }
  const result = await query(
    `UPDATE notifications
        SET is_read = true, read_at = now(), updated_at = now()
      WHERE id = $1 AND society_id = $2 AND user_id = $3 AND channel = 'IN_APP'
      RETURNING id`,
    [notificationId, user.societyId, user.id],
  );
  if (!result.rows[0]) throw new ApiError(404, 'Notification not found');
  return result.rows[0];
};

const getDashboard = async (user) => {
  const societyId = user.societyId;
  if (!societyId) {
    return { society: null, unit: null, maintenance: [], notices: [] };
  }

  const homeResult = await query(
    `SELECT s.id AS society_id, s.name AS society_name, s.currency,
            s.logo_url AS society_logo_url, s.address AS society_address,
            s.email AS society_email, s.phone AS society_phone,
            r.id AS resident_id, r.display_name, r.profile_photo AS resident_photo_url,
            r.email AS resident_email, r.mobile AS resident_mobile,
            r.alternate_mobile AS resident_alternate_mobile,
            r.date_of_birth AS resident_date_of_birth,
            r.emergency_contact_name, r.emergency_contact_mobile,
            r.emergency_contact_relation, r.role AS resident_role,
            r.status AS resident_status,
            t.name AS tower_name, f.name AS floor_name, u.id AS unit_id, u.unit_number
       FROM societies s
       LEFT JOIN residents r
         ON r.society_id = s.id
        AND (r.user_id = $2 OR (r.user_id IS NULL AND lower(r.email) = lower($3)))
        AND r.status = 'ACTIVE'
       LEFT JOIN owner_units ou
         ON ou.owner_id = r.id AND ou.society_id = s.id AND ou.status = 'ACTIVE'
        AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
       LEFT JOIN units u ON u.id = ou.unit_id
       LEFT JOIN floors f ON f.id = u.floor_id
       LEFT JOIN towers t ON t.id = f.tower_id
      WHERE s.id = $1
      ORDER BY ou.effective_from DESC NULLS LAST
      LIMIT 1`,
    [societyId, user.id, user.email],
  );
  const home = homeResult.rows[0];

  const accountResult = await query(
    `SELECT COALESCE(NULLIF(s.photo_path, ''), NULLIF(u.profile_picture_url, '')) AS photo_url
       FROM users u
       LEFT JOIN security_guards sg ON sg.user_id = u.id
       LEFT JOIN staff s
         ON s.id = sg.staff_id
        AND s.staff_type = 'SECURITY_GUARD'
      WHERE u.id = $1
      LIMIT 1`,
    [user.id],
  );

  let maintenance = [];
  let upcomingBookings = [];
  if (home?.resident_id) {
    const invoiceResult = await query(
      `SELECT i.invoice_number, i.billing_period,
              to_char(i.due_date, 'YYYY-MM-DD') AS due_date,
              i.outstanding_amount, i.status, i.description
         FROM invoices i
         JOIN owner_units ou ON ou.unit_id = i.unit_id
        WHERE ou.owner_id = $1 AND ou.society_id = $2 AND ou.status = 'ACTIVE'
          AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
          AND i.society_id = $2 AND i.outstanding_amount > 0
          AND i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
        ORDER BY i.due_date ASC, i.created_at ASC`,
      [home.resident_id, societyId],
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
  // Catch up scheduled notices on dashboard access as well as via the cron job.
  // This keeps notices visible to residents even if the minute scheduler was
  // delayed or unavailable when the scheduled time passed.
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
    account: {
      photoUrl: accountResult.rows[0]?.photo_url || null,
    },
    society: home ? {
      id: home.society_id,
      name: home.society_name,
      currency: home.currency,
      logoUrl: home.society_logo_url,
      address: home.society_address,
      email: home.society_email,
      phone: home.society_phone,
    } : null,
    resident: home?.resident_id ? {
      name: home.display_name,
      photoUrl: home.resident_photo_url,
      email: home.resident_email,
      phone: home.resident_mobile,
      alternatePhone: home.resident_alternate_mobile,
      dateOfBirth: home.resident_date_of_birth,
      emergencyContactName: home.emergency_contact_name,
      emergencyContactPhone: home.emergency_contact_mobile,
      emergencyContactRelation: home.emergency_contact_relation,
      role: home.resident_role,
      status: home.resident_status,
    } : null,
    unit: home?.unit_number ? {
      number: home.unit_number,
      tower: home.tower_name,
      floor: home.floor_name,
    } : null,
    maintenance,
    upcomingBookings,
    notices,
  };
};

module.exports = {
  getDashboard,
  listResidentNotifications,
  markResidentNotificationRead,
};
