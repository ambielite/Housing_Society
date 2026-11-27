const { query } = require('../../config/db');
const noticesService = require('../notices/notices.service');
const { resolveResidentUnits } = require('../resident-context/residentUnitContext.service');
const ApiError = require('../../common/ApiError');
const amenityBookingsService = require('../amenity-bookings/amenity-bookings.service');
const kidsActivitiesService = require('../kids-activities/kids-activities.service');
const advertisementsService = require('../advertisements/advertisements.service');
const eventRsvpService = require('../community/event/eventRsvp.service');
const { resolveResident } = require('../resident-context/residentUnitContext.service');

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

const listResidentCommunityEvents = async (user) => {
  if (!user?.societyId) return [];
  const result = await query(
    `SELECT event.id, event.title, event.description, event.category, event.venue,
            event.start_at, event.end_at, event.registration_start_at, event.registration_end_at,
            event.capacity, event.is_free, event.ticket_price,
            COALESCE(registration_counts.registered_seats, 0)::int AS registered_count,
            CASE WHEN event.capacity IS NULL THEN NULL ELSE GREATEST(
              event.capacity - COALESCE(registration_counts.registered_seats, 0), 0
            )::int END AS remaining_capacity,
            (mine.id IS NOT NULL) AS registered,
            mine.id AS rsvp_id, mine.team_name, mine.participant_names
       FROM community_events event
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(rsvp.total_tickets + rsvp.guest_count)
                  FILTER (WHERE rsvp.status IN ('REGISTERED', 'CHECKED_IN')), 0)::int AS registered_seats
           FROM community_event_rsvps rsvp
          WHERE rsvp.event_id = event.id
       ) registration_counts ON true
       LEFT JOIN community_event_rsvps mine
         ON mine.event_id = event.id AND mine.user_id = $2
        AND mine.status IN ('REGISTERED', 'WAITLISTED', 'CHECKED_IN')
      WHERE event.society_id = $1
        AND event.status = 'PUBLISHED'
        AND COALESCE(event.end_at, event.start_at) > now()
      ORDER BY event.start_at ASC`,
    [user.societyId, user.id],
  );
  return result.rows.map((event) => ({
    ...event,
    registration_open: (!event.registration_start_at || new Date(event.registration_start_at) <= new Date()) &&
      (!event.registration_end_at || new Date(event.registration_end_at) >= new Date()) &&
      new Date(event.start_at) > new Date() &&
      (event.remaining_capacity == null || event.remaining_capacity > 0),
  }));
};

const registerResidentForCommunityEvent = async (user, eventId, input = {}) => {
  if (!user?.societyId) throw new ApiError(403, 'Your account is not linked to a society');
  const resident = await resolveResident(user, { allowEmailFallback: false });
  if (!resident) throw new ApiError(403, 'Your resident profile is not linked to this account');
  const teamName = String(input.teamName || '').trim();
  if (teamName.length > 120) throw new ApiError(400, 'Team name must be 120 characters or fewer');
  const participantNames = Array.isArray(input.participantNames)
    ? input.participantNames.map((name) => String(name || '').trim())
    : [];
  if (!participantNames.length || participantNames.length > 20 || participantNames.some((name) => !name || name.length > 100)) {
    throw new ApiError(400, 'Enter between 1 and 20 participant names, with each name 100 characters or fewer');
  }
  return eventRsvpService.registerForEvent({
    eventId,
    societyId: user.societyId,
    userId: user.id,
    totalTickets: participantNames.length,
    guestCount: 0,
    teamName,
    participantNames,
  });
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
  const kidsActivities = await kidsActivitiesService.listResident(user);
  const communityEvents = resident ? await listResidentCommunityEvents(user) : [];
  const advertisements = await advertisementsService.listForResident(user);

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
    kidsActivities,
    communityEvents,
    advertisements,
  };
};

module.exports = { getDashboard, listResidentNotifications, markResidentNotificationRead, listSocietyStaff, registerResidentForCommunityEvent };
