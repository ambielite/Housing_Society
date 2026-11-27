const { query, getClient } = require('../../config/db');
const ApiError = require('../../common/ApiError');
const { resolveResidentUnits } = require('../resident-context/residentUnitContext.service');
const residentDashboardEvents = require('../resident-dashboard/residentDashboardEvents');

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const normalizeActivityInput = (input) => {
  const name = String(input.name || '').trim();
  const description = String(input.description || '').trim();
  const minimumAge = Number(input.minimumAge);
  const maximumAge = Number(input.maximumAge);
  const registrationRequired = input.registrationRequired == null
    ? true
    : input.registrationRequired === true || input.registrationRequired === 'true';
  const registrationDeadline = input.registrationDeadline ? new Date(input.registrationDeadline) : null;
  if (!name || name.length > 200) throw new ApiError(400, 'Enter an activity name of up to 200 characters');
  if (!description || description.length > 3000) throw new ApiError(400, 'Enter an activity description of up to 3,000 characters');
  if (input.minimumAge === '' || input.maximumAge === '' || !Number.isInteger(minimumAge) || minimumAge < 0 || minimumAge > 18) throw new ApiError(400, 'From age must be from 0 to 18');
  if (!Number.isInteger(maximumAge) || maximumAge < 1 || maximumAge < minimumAge || maximumAge > 18) throw new ApiError(400, 'To age must be from the selected from age up to 18');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date || '') || !/^\d{2}:\d{2}$/.test(input.time || '') || !/^\d{2}:\d{2}$/.test(input.endTime || '')) throw new ApiError(400, 'Enter a valid activity date, start time, and end time');
  if (input.endTime <= input.time) throw new ApiError(400, 'Activity end time must be later than its start time');
  if (registrationRequired && (!registrationDeadline || Number.isNaN(registrationDeadline.getTime()))) throw new ApiError(400, 'Set a valid resident registration deadline');
  if (registrationDeadline && registrationDeadline <= new Date()) throw new ApiError(400, 'Registration deadline must be in the future');
  const date = new Date(`${input.date}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Enter a valid activity date');
  const activityStart = new Date(`${input.date}T${input.time}:00+05:30`);
  const activityEnd = new Date(`${input.date}T${input.endTime}:00+05:30`);
  if (registrationRequired && registrationDeadline > activityEnd) throw new ApiError(400, 'Registration deadline cannot be after the activity end time');
  if (registrationRequired && registrationDeadline >= activityStart) throw new ApiError(400, 'Registration deadline must be before the activity starts');
  return { name, description, minimumAge, maximumAge, registrationRequired,
    day: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
    date: input.date, time: input.time, endTime: input.endTime, prize: String(input.winnerPrize || '').trim() || null,
    registrationDeadline: registrationRequired ? registrationDeadline.toISOString() : null };
};
const listForAdmin = async (societyId) => {
  const result = await query(
    `SELECT activity.*, activity.activity_date::text AS activity_date,
            COUNT(DISTINCT registration.id)::int AS registration_count,
            COUNT(child.id)::int AS child_count
       FROM kids_activities activity
       LEFT JOIN kids_activity_registrations registration ON registration.activity_id = activity.id
       LEFT JOIN kids_activity_children child ON child.registration_id = registration.id
      WHERE activity.society_id = $1
      GROUP BY activity.id ORDER BY activity.activity_date DESC, activity.activity_time DESC, activity.created_at DESC`,
    [societyId],
  );
  return result.rows;
};

const listResident = async (user) => {
  if (!user.societyId) return [];
  const result = await query(
    `SELECT activity.id, activity.name, activity.description, activity.activity_date::text AS activity_date, activity.activity_day,
            activity.activity_time, COALESCE(activity.activity_end_time, activity.activity_time) AS activity_end_time,
            activity.minimum_age, activity.maximum_age, activity.winner_prize,
            activity.registration_required, activity.registration_deadline, activity.status, activity.created_at,
            (activity.registration_required AND (activity.registration_deadline IS NULL OR activity.registration_deadline > now())) AS registration_open,
            EXISTS (
              SELECT 1 FROM kids_activity_registrations registration
               WHERE registration.activity_id = activity.id AND registration.user_id = $2
            ) AS registered,
            '[]'::jsonb AS children
       FROM kids_activities activity
      WHERE activity.society_id = $1 AND activity.status = 'OPEN'
        AND (activity.activity_date + COALESCE(activity.activity_end_time, activity.activity_time)) > timezone('Asia/Kolkata', now())
      ORDER BY activity.activity_date, activity.activity_time`,
    [user.societyId, user.id],
  );
  return result.rows;
};

const create = async (user, input) => {
  const { name, description, minimumAge, maximumAge, registrationRequired, registrationDeadline, day, date, time, endTime, prize } = normalizeActivityInput(input);
  const client = await getClient();
  let activity;
  let userIds = [];
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO kids_activities
        (society_id, created_by, name, description, activity_date, activity_day, activity_time, activity_end_time, minimum_age, maximum_age, winner_prize, registration_required, registration_deadline)
       VALUES ($1, $2, $3, $4, $5::date, $6, $7::time, $8::time, $9, $10, $11, $12, $13::timestamptz) RETURNING *`,
      [user.societyId, user.id, name, description, date, day, time, endTime, minimumAge, maximumAge, prize, registrationRequired, registrationDeadline],
    );
    activity = result.rows[0];
    const notifications = await client.query(
      `INSERT INTO notifications
        (society_id, user_id, channel, notification_type, title, subject, message, data,
         reference_type, reference_id, priority, status, created_at, updated_at)
       SELECT $1, recipients.user_id, 'IN_APP', 'OPERATIONAL', $2, $2, $3,
              jsonb_build_object('activityId', $4::uuid, 'activityDate', $5::date,
                'activityTime', $6::time, 'activityEndTime', $7::time,
                'minimumAge', $8::smallint, 'maximumAge', $9::smallint,
                'registrationRequired', $10::boolean, 'registrationDeadline', $11::timestamptz),
              'KIDS_ACTIVITY', $4::uuid, 'MEDIUM', 'PENDING', now(), now()
         FROM (
           SELECT DISTINCT account.id AS user_id
             FROM residents resident
             JOIN users account ON account.society_id = resident.society_id
              AND (account.id = resident.user_id OR
                   (resident.user_id IS NULL AND lower(account.email) = lower(resident.email)))
            WHERE resident.society_id = $1 AND resident.status = 'ACTIVE'
              AND account.status = 'ACTIVE'
         ) recipients
       ON CONFLICT DO NOTHING RETURNING user_id`,
      [user.societyId, `New kids activity: ${name}`, `${description} ${day}, ${date} from ${time} to ${endTime}. Eligible ages: ${minimumAge}-${maximumAge}. ${registrationRequired ? `Register participating children by ${new Date(registrationDeadline).toLocaleString()}.` : 'Registration is not required.'}`, activity.id, date, time, endTime, minimumAge, maximumAge, registrationRequired, registrationDeadline],
    );
    userIds = notifications.rows.map((row) => row.user_id);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  residentDashboardEvents.publishToUsers(userIds, 'kids-activity-published');
  return activity;
};

const update = async (user, activityId, input) => {
  if (!uuidPattern.test(activityId)) throw new ApiError(400, 'Invalid activity ID');
  const { name, description, minimumAge, maximumAge, registrationRequired, registrationDeadline, day, date, time, endTime, prize } = normalizeActivityInput(input);
  const client = await getClient();
  let activity;
  let userIds = [];
  try {
    await client.query('BEGIN');
    const previousResult = await client.query(
      'SELECT registration_deadline, registration_required, created_by FROM kids_activities WHERE id = $1 AND society_id = $2 FOR UPDATE',
      [activityId, user.societyId],
    );
    const previous = previousResult.rows[0];
    if (!previous) throw new ApiError(404, 'Kids activity not found');
    const result = await client.query(
      `UPDATE kids_activities
          SET name = $3, description = $4, activity_date = $5::date, activity_day = $6,
              activity_time = $7::time, activity_end_time = $8::time, minimum_age = $9, maximum_age = $10,
              winner_prize = $11, registration_required = $12, registration_deadline = $13::timestamptz,
              registration_expired_at = CASE
                WHEN NOT $12::boolean OR $13::timestamptz > now() THEN NULL
                ELSE registration_expired_at END,
              updated_at = now()
        WHERE id = $1 AND society_id = $2 RETURNING *`,
      [activityId, user.societyId, name, description, date, day, time, endTime, minimumAge, maximumAge, prize, registrationRequired, registrationDeadline],
    );
    activity = result.rows[0];
    const notificationResult = await client.query(
      `UPDATE notifications
          SET title = $3, subject = $3, message = $4,
              data = COALESCE(data, '{}'::jsonb) || jsonb_build_object(
                'activityId', $2::uuid, 'activityDate', $6::date, 'activityTime', $7::time,
                'activityEndTime', $8::time, 'minimumAge', $9::smallint, 'maximumAge', $10::smallint,
                'registrationRequired', $11::boolean, 'registrationDeadline', $5::timestamptz),
              updated_at = now()
        WHERE society_id = $1 AND reference_type = 'KIDS_ACTIVITY' AND reference_id = $2::uuid
        RETURNING user_id`,
      [user.societyId, activityId, `Kids activity updated: ${name}`, `${description} ${day}, ${date} from ${time} to ${endTime}. ${registrationRequired ? `Register by ${new Date(registrationDeadline).toLocaleString()}.` : 'Registration is not required.'}`, registrationDeadline, date, time, endTime, minimumAge, maximumAge, registrationRequired],
    );
    userIds = notificationResult.rows.map((row) => row.user_id);
    const previousDeadline = previous.registration_deadline ? new Date(previous.registration_deadline) : null;
    const newDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    const registrationEnabled = registrationRequired && !previous.registration_required;
    const deadlineExtended = registrationRequired && newDeadline && (!previousDeadline || newDeadline > previousDeadline);
    if (deadlineExtended) {
      const extensionNotifications = await client.query(
        `WITH recipients AS (
           SELECT user_id FROM notifications
            WHERE society_id = $1 AND reference_type = 'KIDS_ACTIVITY' AND reference_id = $2::uuid
           UNION SELECT created_by FROM kids_activities WHERE id = $2 AND society_id = $1
           UNION SELECT $3::uuid
           UNION SELECT account.id
             FROM residents resident
             JOIN users account ON account.society_id = resident.society_id
              AND (account.id = resident.user_id OR
                   (resident.user_id IS NULL AND lower(account.email) = lower(resident.email)))
            WHERE resident.society_id = $1 AND resident.status = 'ACTIVE'
              AND account.status = 'ACTIVE'
         )
         INSERT INTO notifications
           (society_id, user_id, channel, notification_type, title, subject, message, data,
            reference_type, reference_id, priority, status, created_at, updated_at)
         SELECT $1, recipients.user_id, 'IN_APP', 'OPERATIONAL', $4, $4, $5,
                jsonb_build_object('activityId', $2::uuid, 'registrationDeadline', $6::timestamptz,
                  'registrationDeadlineExtended', true),
                'KIDS_ACTIVITY', $2::uuid, 'MEDIUM', 'PENDING', now(), now()
           FROM recipients WHERE recipients.user_id IS NOT NULL
         ON CONFLICT DO NOTHING RETURNING user_id`,
        [user.societyId, activityId, user.id,
          registrationEnabled ? `Registration is open: ${name}` : `Registration deadline extended: ${name}`,
          registrationEnabled
            ? `Resident registration for ${name} is now open until ${new Date(registrationDeadline).toLocaleString()}.`
            : `The registration deadline for ${name} has been extended to ${new Date(registrationDeadline).toLocaleString()}.`,
          registrationDeadline],
      );
      userIds.push(...extensionNotifications.rows.map((row) => row.user_id));
    }
    // Always refresh resident feeds after an edit, even if an older activity
    // has no original notification rows to use as the event recipient list.
    const residentUsers = await client.query(
      `SELECT DISTINCT account.id AS user_id
         FROM residents resident
         JOIN users account ON account.society_id = resident.society_id
          AND (account.id = resident.user_id OR
               (resident.user_id IS NULL AND lower(account.email) = lower(resident.email)))
        WHERE resident.society_id = $1 AND resident.status = 'ACTIVE'
          AND account.status = 'ACTIVE'`,
      [user.societyId],
    );
    userIds.push(...residentUsers.rows.map((row) => row.user_id));
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  residentDashboardEvents.publishToUsers(userIds, 'kids-activity-published');
  return activity;
};

const remove = async (societyId, activityId) => {
  if (!uuidPattern.test(activityId)) throw new ApiError(400, 'Invalid activity ID');
  const client = await getClient();
  let userIds = [];
  try {
    await client.query('BEGIN');
    const notifications = await client.query(
      `DELETE FROM notifications
        WHERE society_id = $1 AND reference_type = 'KIDS_ACTIVITY' AND reference_id = $2::uuid
        RETURNING user_id`,
      [societyId, activityId],
    );
    const activity = await client.query(
      'DELETE FROM kids_activities WHERE id = $1 AND society_id = $2 RETURNING id',
      [activityId, societyId],
    );
    if (!activity.rowCount) throw new ApiError(404, 'Kids activity not found');
    userIds = notifications.rows.map((row) => row.user_id);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  residentDashboardEvents.publishToUsers(userIds, 'kids-activity-published');
  return { id: activityId };
};

const listRegistrations = async (societyId, activityId) => {
  if (!uuidPattern.test(activityId)) throw new ApiError(400, 'Invalid activity ID');
  const result = await query(
    `SELECT registration.id AS registration_id,
            COALESCE(NULLIF(resident.display_name, ''), concat_ws(' ', resident.first_name, resident.middle_name, resident.last_name)) AS resident_name,
            tower.name AS tower_name, unit.unit_number, child.name AS child_name,
            child.age AS child_age, registration.created_at
       FROM kids_activity_registrations registration
       JOIN kids_activities activity ON activity.id = registration.activity_id AND activity.society_id = $1
       JOIN residents resident ON resident.id = registration.resident_id
       JOIN units unit ON unit.id = registration.unit_id
       JOIN floors floor ON floor.id = unit.floor_id
       JOIN towers tower ON tower.id = floor.tower_id
       JOIN kids_activity_children child ON child.registration_id = registration.id
      WHERE registration.activity_id = $2 AND registration.society_id = $1
      ORDER BY tower.name, unit.unit_number, resident.display_name, child.name`,
    [societyId, activityId],
  );
  return result.rows;
};

const register = async (user, activityId, children) => {
  if (!uuidPattern.test(activityId)) throw new ApiError(400, 'Invalid activity ID');
  if (!Array.isArray(children) || children.length < 1 || children.length > 12) throw new ApiError(400, 'Add between 1 and 12 children to register');
  const validChildren = children.map((child) => ({ name: String(child?.name || '').trim(), age: Number(child?.age) }));
  if (validChildren.some((child) => !child.name || child.name.length > 120 || !Number.isInteger(child.age) || child.age < 0 || child.age > 18)) throw new ApiError(400, 'Enter a name and valid age for every child');
  const context = await resolveResidentUnits(user);
  if (!context.resident) throw new ApiError(403, 'Your resident profile is not linked to this account');
  if (!context.units.length) throw new ApiError(403, 'Your resident profile is not linked to an active unit');
  const unit = context.units[0];
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const activityResult = await client.query(
      `SELECT id, name, created_by, minimum_age, maximum_age, registration_required, registration_deadline FROM kids_activities
        WHERE id = $1 AND society_id = $2 AND status = 'OPEN'
          AND (
            (activity_date + COALESCE(activity_end_time, activity_time)) > timezone('Asia/Kolkata', now())
            OR (registration_required AND registration_deadline > now())
          ) FOR UPDATE`,
      [activityId, user.societyId],
    );
    const activity = activityResult.rows[0];
    if (!activity) throw new ApiError(404, 'This activity is no longer open for registration');
    if (!activity.registration_required) throw new ApiError(409, 'Registration is not required for this activity');
    if (activity.registration_deadline && new Date(activity.registration_deadline) <= new Date()) throw new ApiError(409, 'The registration deadline for this activity has passed');
    if (validChildren.some((child) => child.age < activity.minimum_age || child.age > activity.maximum_age)) throw new ApiError(400, `Children must be between ${activity.minimum_age} and ${activity.maximum_age} years old for this activity`);
    const registrationResult = await client.query(
      `INSERT INTO kids_activity_registrations (activity_id, society_id, user_id, resident_id, unit_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [activityId, user.societyId, user.id, context.resident.id, unit.unit_id],
    );
    const registrationId = registrationResult.rows[0].id;
    await client.query('DELETE FROM kids_activity_children WHERE registration_id = $1', [registrationId]);
    for (const child of validChildren) {
      await client.query('INSERT INTO kids_activity_children (registration_id, name, age) VALUES ($1, $2, $3)', [registrationId, child.name, child.age]);
    }
    await client.query('COMMIT');
    const residentName = context.resident.display_name || user.name || 'A resident';
    // Keep notification writes from holding the completed registration request open.
    void (async () => {
      const notificationWrites = [query(
        `INSERT INTO notifications
          (society_id, user_id, channel, notification_type, title, subject, message, data,
           reference_type, reference_id, priority, status, created_at, updated_at)
         VALUES ($1, $2, 'IN_APP', 'OPERATIONAL', $3, $3, $4, $5::jsonb,
                 'KIDS_ACTIVITY', $6::uuid, 'MEDIUM', 'PENDING', now(), now())`,
        [user.societyId, user.id, `Registration submitted: ${activity.name}`,
          `Your registration for ${activity.name} was submitted successfully with ${validChildren.length} ${validChildren.length === 1 ? 'child' : 'children'}.`,
          JSON.stringify({ activityId, registrationId, childCount: validChildren.length }), activityId],
      )];
      if (activity.created_by) {
        notificationWrites.push(query(
        `INSERT INTO notifications
          (society_id, user_id, channel, notification_type, title, subject, message, data,
           reference_type, reference_id, priority, status, created_at, updated_at)
         VALUES ($1, $2, 'IN_APP', 'OPERATIONAL', $3, $3, $4, $5::jsonb,
                 'KIDS_ACTIVITY', $6::uuid, 'MEDIUM', 'PENDING', now(), now())`,
        [user.societyId, activity.created_by, `New registration: ${activity.name}`,
          `${residentName} submitted ${validChildren.length} ${validChildren.length === 1 ? 'child' : 'children'} for ${activity.name}.`,
          JSON.stringify({ activityId, registrationId, residentName, childCount: validChildren.length }), activityId],
        ));
      }
      await Promise.all(notificationWrites);
      residentDashboardEvents.publishToUsers([user.id], 'resident-updated');
    })().catch((error) => console.error('Could not queue kids activity registration notifications', error));
    return { id: registrationId, children: validChildren };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { listForAdmin, listResident, create, update, remove, listRegistrations, register };
