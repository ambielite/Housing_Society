const db = require('../../config/db');
const residentDashboardEvents = require('../resident-dashboard/residentDashboardEvents');

const RECIPIENTS_CTE = `
  WITH recipients AS (
    SELECT id AS user_id FROM users WHERE society_id = $1 AND status = 'ACTIVE'
    UNION
    SELECT user_id FROM user_society_access
      WHERE society_id = $1 AND active_from <= now()
        AND (active_until IS NULL OR active_until > now())
    UNION
    SELECT user_id FROM society_accesses
      WHERE society_id = $1 AND is_active = true
        AND (valid_from IS NULL OR valid_from <= now())
        AND (valid_until IS NULL OR valid_until > now())
  )`;

const upsertNoticeNotification = async (societyId, notice, title, message, data) => {
  const result = await db.query(
    `${RECIPIENTS_CTE}, existing_notice_notifications AS (
       SELECT notification.id, notification.user_id,
              row_number() OVER (
                PARTITION BY notification.user_id
                ORDER BY notification.created_at DESC, notification.id DESC
              ) AS row_number
         FROM notifications notification
         JOIN recipients ON recipients.user_id = notification.user_id
        WHERE notification.society_id = $1
          AND notification.reference_type = 'NOTICE'
          AND notification.reference_id = $4::uuid
     ), removed_duplicates AS (
       DELETE FROM notifications notification
        USING existing_notice_notifications existing
        WHERE notification.id = existing.id AND existing.row_number > 1
       RETURNING notification.id
     ), updated AS (
       UPDATE notifications notification
          SET title = $2, subject = $2, message = $3, data = $5::jsonb,
              status = 'PENDING', is_read = false, read_at = NULL,
              created_at = now(), updated_at = now()
         FROM existing_notice_notifications existing
        WHERE notification.id = existing.id AND existing.row_number = 1
       RETURNING notification.user_id
     ), inserted AS (
       INSERT INTO notifications
       (society_id, user_id, channel, notification_type, title, subject, message,
        data, reference_type, reference_id, priority, status, created_at, updated_at)
       SELECT $1, recipients.user_id, 'IN_APP', 'OPERATIONAL', $2, $2, $3,
              $5::jsonb, 'NOTICE', $4::uuid, 'MEDIUM', 'PENDING', now(), now()
         FROM recipients
        WHERE NOT EXISTS (
          SELECT 1 FROM existing_notice_notifications existing
           WHERE existing.user_id = recipients.user_id
        )
       ON CONFLICT (society_id, user_id, reference_id)
         WHERE reference_type = 'NOTICE' AND reference_id IS NOT NULL
       DO UPDATE SET title = EXCLUDED.title, subject = EXCLUDED.subject,
                     message = EXCLUDED.message, data = EXCLUDED.data,
                     status = 'PENDING', is_read = false, read_at = NULL,
                     created_at = now(), updated_at = now()
       RETURNING user_id
     )
     SELECT ARRAY(
       SELECT user_id FROM updated
       UNION
       SELECT user_id FROM inserted
     ) AS notified_user_ids`,
    [societyId, title, message, notice.id, JSON.stringify(data)],
  );
  const userIds = result.rows[0]?.notified_user_ids || [];
  residentDashboardEvents.publishToUsers(userIds, 'notice-published');
  return userIds.length;
};

const queueNoticeNotifications = async (societyId, notice) => {
  return upsertNoticeNotification(
    societyId,
    notice,
    notice.title,
    notice.description,
    {
      noticeId: notice.id,
      scheduledAt: notice.scheduled_at || null,
      expiresAt: notice.expires_at || null,
    },
  );
};

// Backfill notifications for future notices created before immediate queuing was added.
// This is intentionally insert-only so polling never resets a resident's read state.
const queueUpcomingNoticeNotifications = async () => {
  const result = await db.query(
    `WITH upcoming AS (
       SELECT id, society_id, title, description, scheduled_at, expires_at
         FROM notices
        WHERE status = 'SCHEDULED' AND scheduled_at > now()
          AND (expires_at IS NULL OR expires_at > now())
     ), recipients AS (
       SELECT upcoming.*, users.id AS user_id
         FROM upcoming JOIN users ON users.society_id = upcoming.society_id AND users.status = 'ACTIVE'
       UNION
       SELECT upcoming.*, usa.user_id
         FROM upcoming JOIN user_society_access usa ON usa.society_id = upcoming.society_id
        WHERE usa.active_from <= now() AND (usa.active_until IS NULL OR usa.active_until > now())
       UNION
       SELECT upcoming.*, sa.user_id
         FROM upcoming JOIN society_accesses sa ON sa.society_id = upcoming.society_id AND sa.is_active = true
        WHERE (sa.valid_from IS NULL OR sa.valid_from <= now())
          AND (sa.valid_until IS NULL OR sa.valid_until > now())
     ), inserted AS (
       INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, created_at, updated_at)
       SELECT society_id, user_id, 'IN_APP', 'OPERATIONAL', title, title, description,
              jsonb_build_object('noticeId', id, 'scheduledAt', scheduled_at, 'expiresAt', expires_at),
              'NOTICE', id, 'MEDIUM', 'PENDING', now(), now()
         FROM recipients
       ON CONFLICT (society_id, user_id, reference_id)
         WHERE reference_type = 'NOTICE' AND reference_id IS NOT NULL
       DO NOTHING
       RETURNING user_id
     )
     SELECT count(*)::int AS queued_count,
            COALESCE(array_agg(DISTINCT user_id), ARRAY[]::uuid[]) AS notified_user_ids
       FROM inserted`,
  );
  return result.rows[0] || { queued_count: 0, notified_user_ids: [] };
};

const queueNoticeUpdateNotifications = async (societyId, notice) => {
  return upsertNoticeNotification(
    societyId,
    notice,
    `Notice updated: ${notice.title}`,
    notice.description,
    {
      noticeId: notice.id,
      scheduledAt: notice.scheduled_at || null,
      expiresAt: notice.expires_at || null,
      noticeUpdated: true,
    },
  );
};

const queueNoticeExpiredNotifications = async (societyId, notice) => {
  return upsertNoticeNotification(
    societyId,
    notice,
    `Notice expired: ${notice.title}`,
    `The notice "${notice.title}" has expired and is no longer available.`,
    {
      noticeId: notice.id,
      expiresAt: notice.expires_at || notice.expired_at || null,
      noticeExpired: true,
    },
  );
};

const deduplicateNoticeNotifications = async () => {
  await db.query(
    `WITH ranked AS (
       SELECT id,
              row_number() OVER (
                PARTITION BY society_id, user_id, reference_id
                ORDER BY created_at DESC, id DESC
              ) AS row_number
         FROM notifications
        WHERE reference_type = 'NOTICE' AND reference_id IS NOT NULL
     )
     DELETE FROM notifications notification
      USING ranked
      WHERE notification.id = ranked.id AND ranked.row_number > 1`,
  );
};

const list = async ({ societyId, tab, search, limit, offset }) => {
  const params = [societyId];
  const filters = ['n.society_id = $1'];
  if (tab === 'upcoming') {
    filters.push("n.status = 'SCHEDULED' AND n.scheduled_at > now()");
  } else if (tab === 'expired') {
    filters.push("(n.status = 'EXPIRED' OR (n.status = 'PUBLISHED' AND n.expires_at IS NOT NULL AND n.expires_at <= now()))");
  } else {
    filters.push("n.status = 'PUBLISHED' AND (n.expires_at IS NULL OR n.expires_at > now())");
  }
  if (search) {
    params.push(`%${search}%`);
    filters.push(`(n.title ILIKE $${params.length} OR n.description ILIKE $${params.length})`);
  }
  const countResult = await db.query(
    `SELECT count(*)::int AS total FROM notices n WHERE ${filters.join(' AND ')}`,
    params,
  );
  const total = countResult.rows[0]?.total || 0;
  const pagedParams = [...params, limit, offset];
  const result = await db.query(
    `${RECIPIENTS_CTE}
     SELECT n.id, n.society_id, n.title, n.description, n.status,
            n.posted_at, n.scheduled_at, n.expires_at, n.renotified_at,
            n.renotify_count, n.expired_by, n.expired_at, n.created_by, n.created_at, n.updated_at,
            COALESCE(NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, 'System') AS posted_by,
            COALESCE(NULLIF(trim(concat_ws(' ', eu.first_name, eu.last_name)), ''), eu.email, 'System') AS expired_by_name,
            (SELECT count(*)::int FROM notice_reads nr WHERE nr.notice_id = n.id) AS read_count,
            (SELECT count(*)::int FROM recipients) AS recipient_count
     FROM notices n LEFT JOIN users u ON u.id = n.created_by LEFT JOIN users eu ON eu.id = n.expired_by
     WHERE ${filters.join(' AND ')}
     ORDER BY COALESCE(n.scheduled_at, n.posted_at, n.created_at) DESC, n.created_at DESC
     LIMIT $${pagedParams.length - 1} OFFSET $${pagedParams.length}`,
    pagedParams,
  );
  return { rows: result.rows, total };
};

const findById = async (societyId, id) => {
  const result = await db.query(
    `SELECT n.id, n.society_id, n.title, n.description, n.status,
            n.posted_at, n.scheduled_at, n.expires_at, n.renotified_at,
            n.renotify_count, n.expired_by, n.expired_at, n.created_by, n.created_at, n.updated_at,
            COALESCE(NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, 'System') AS posted_by,
            COALESCE(NULLIF(trim(concat_ws(' ', eu.first_name, eu.last_name)), ''), eu.email, 'System') AS expired_by_name,
            (SELECT count(*)::int FROM notice_reads nr WHERE nr.notice_id = n.id) AS read_count
     FROM notices n LEFT JOIN users u ON u.id = n.created_by LEFT JOIN users eu ON eu.id = n.expired_by
     WHERE n.society_id = $1 AND n.id = $2`,
    [societyId, id],
  );
  return result.rows[0] || null;
};

const create = async ({ societyId, createdBy, title, description, scheduledAt, expiresAt }) => {
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
  const result = await db.query(
    `INSERT INTO notices (society_id, created_by, updated_by, title, description,
       scheduled_at, expires_at, posted_at, status)
     VALUES ($1, $2, $2, $3, $4, $5, $6, CASE WHEN $7 THEN NULL ELSE now() END,
       CASE WHEN $7 THEN 'SCHEDULED' ELSE 'PUBLISHED' END)
     RETURNING *`,
    [societyId, createdBy, title, description, isScheduled ? scheduledAt : null, expiresAt || null, Boolean(isScheduled)],
  );
  const notice = result.rows[0];
  // Residents can see scheduled notices in Announcements immediately, so place the
  // matching bell notification at creation time as well.
  notice.queued_count = await queueNoticeNotifications(societyId, notice);
  return notice;
};

const update = async ({ societyId, id, updatedBy, title, description, scheduledAt, expiresAt }) => {
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
  const result = await db.query(
    `UPDATE notices SET title = $3, description = $4, scheduled_at = $5,
       expires_at = $6, posted_at = CASE WHEN $7 THEN NULL ELSE COALESCE(posted_at, now()) END,
       status = CASE WHEN status = 'EXPIRED' THEN status WHEN $7 THEN 'SCHEDULED' ELSE 'PUBLISHED' END,
       updated_by = $2, updated_at = now()
     WHERE society_id = $1 AND id = $8
     RETURNING *`,
    [societyId, updatedBy, title, description, isScheduled ? scheduledAt : null, expiresAt || null, Boolean(isScheduled), id],
  );
  return result.rows[0] || null;
};

const publishDue = async () => {
  const result = await db.query(
    `WITH due AS (
       UPDATE notices SET status = 'PUBLISHED', posted_at = COALESCE(posted_at, scheduled_at), updated_at = now()
       WHERE status = 'SCHEDULED' AND scheduled_at <= now()
         AND (expires_at IS NULL OR expires_at > now())
       RETURNING id, society_id, title, description, scheduled_at, expires_at
     ), recipients AS (
       SELECT due.id AS notice_id, due.society_id, due.title, due.description,
              due.scheduled_at, due.expires_at, users.id AS user_id
       FROM due JOIN users ON users.society_id = due.society_id AND users.status = 'ACTIVE'
       UNION
       SELECT due.id, due.society_id, due.title, due.description,
              due.scheduled_at, due.expires_at, usa.user_id
       FROM due JOIN user_society_access usa ON usa.society_id = due.society_id
       WHERE usa.active_from <= now() AND (usa.active_until IS NULL OR usa.active_until > now())
       UNION
       SELECT due.id, due.society_id, due.title, due.description,
              due.scheduled_at, due.expires_at, sa.user_id
       FROM due JOIN society_accesses sa ON sa.society_id = due.society_id AND sa.is_active = true
       WHERE (sa.valid_from IS NULL OR sa.valid_from <= now())
         AND (sa.valid_until IS NULL OR sa.valid_until > now())
     ), queued AS (
       INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, created_at, updated_at)
       SELECT society_id, user_id, 'IN_APP', 'OPERATIONAL',
              title, title, description,
              jsonb_build_object('noticeId', notice_id, 'scheduledAt', scheduled_at, 'expiresAt', expires_at), 'NOTICE', notice_id,
              'MEDIUM', 'PENDING', now(), now()
       FROM recipients
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications existing
          WHERE existing.society_id = recipients.society_id
            AND existing.user_id = recipients.user_id
            AND existing.reference_type = 'NOTICE'
            AND existing.reference_id = recipients.notice_id
       )
       ON CONFLICT (society_id, user_id, reference_id)
         WHERE reference_type = 'NOTICE' AND reference_id IS NOT NULL
       DO NOTHING
       RETURNING user_id, reference_id
     ), expired AS (
       UPDATE notices SET status = 'EXPIRED', expired_at = COALESCE(expired_at, expires_at), updated_at = now()
       WHERE status IN ('PUBLISHED', 'SCHEDULED') AND expires_at IS NOT NULL AND expires_at <= now()
       RETURNING id, society_id, title, expires_at
     ), expired_recipients AS (
       SELECT expired.id AS notice_id, expired.society_id, expired.title, expired.expires_at,
              users.id AS user_id
         FROM expired JOIN users ON users.society_id = expired.society_id AND users.status = 'ACTIVE'
       UNION
       SELECT expired.id, expired.society_id, expired.title, expired.expires_at, usa.user_id
         FROM expired JOIN user_society_access usa ON usa.society_id = expired.society_id
        WHERE usa.active_from <= now() AND (usa.active_until IS NULL OR usa.active_until > now())
       UNION
       SELECT expired.id, expired.society_id, expired.title, expired.expires_at, sa.user_id
         FROM expired JOIN society_accesses sa ON sa.society_id = expired.society_id AND sa.is_active = true
        WHERE (sa.valid_from IS NULL OR sa.valid_from <= now())
          AND (sa.valid_until IS NULL OR sa.valid_until > now())
     ), expired_existing_notifications AS (
       UPDATE notifications existing
          SET title = 'Notice expired: ' || expired_recipients.title,
              subject = 'Notice expired: ' || expired_recipients.title,
              message = 'The notice "' || expired_recipients.title || '" has expired and is no longer available.',
              data = jsonb_build_object('noticeId', expired_recipients.notice_id,
                                        'expiresAt', expired_recipients.expires_at,
                                        'noticeExpired', true),
              status = 'PENDING', is_read = false, read_at = NULL,
              created_at = now(), updated_at = now()
         FROM expired_recipients
        WHERE existing.society_id = expired_recipients.society_id
          AND existing.user_id = expired_recipients.user_id
          AND existing.reference_type = 'NOTICE'
          AND existing.reference_id = expired_recipients.notice_id
       RETURNING existing.user_id
     ), expiration_notifications AS (
       INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, created_at, updated_at)
       SELECT society_id, user_id, 'IN_APP', 'OPERATIONAL',
              'Notice expired: ' || title, 'Notice expired: ' || title,
              'The notice "' || title || '" has expired and is no longer available.',
              jsonb_build_object('noticeId', notice_id, 'expiresAt', expires_at, 'noticeExpired', true),
              'NOTICE', notice_id, 'MEDIUM', 'PENDING', now(), now()
         FROM expired_recipients
        WHERE NOT EXISTS (
          SELECT 1 FROM notifications existing
           WHERE existing.society_id = expired_recipients.society_id
             AND existing.user_id = expired_recipients.user_id
             AND existing.reference_type = 'NOTICE'
             AND existing.reference_id = expired_recipients.notice_id
        )
       ON CONFLICT (society_id, user_id, reference_id)
         WHERE reference_type = 'NOTICE' AND reference_id IS NOT NULL
       DO UPDATE SET title = EXCLUDED.title, subject = EXCLUDED.subject,
                     message = EXCLUDED.message, data = EXCLUDED.data,
                     status = 'PENDING', is_read = false, read_at = NULL,
                     created_at = now(), updated_at = now()
       RETURNING user_id
     )
     SELECT (SELECT count(*)::int FROM due) AS published_count,
            (SELECT count(*)::int FROM queued) AS queued_count,
            (SELECT count(*)::int FROM expired) AS expired_count,
            ARRAY(
              SELECT user_id FROM recipients
              UNION
              SELECT user_id FROM expired_recipients
              UNION
              SELECT user_id FROM expiration_notifications
              UNION
              SELECT user_id FROM expired_existing_notifications
            ) AS notified_user_ids`,
  );
  await deduplicateNoticeNotifications();
  return result.rows[0];
};

const markRead = async (societyId, noticeId, userId) => {
  const result = await db.query(
    `INSERT INTO notice_reads (society_id, notice_id, user_id)
     SELECT $1, n.id, $3 FROM notices n
     WHERE n.society_id = $1 AND n.id = $2 AND n.status = 'PUBLISHED'
       AND (n.expires_at IS NULL OR n.expires_at > now())
     ON CONFLICT (notice_id, user_id) DO UPDATE SET read_at = EXCLUDED.read_at
     RETURNING *`,
    [societyId, noticeId, userId],
  );
  return result.rows[0] || null;
};

const expire = async (societyId, id, userId) => {
  const result = await db.query(
    `UPDATE notices SET status = 'EXPIRED', expired_by = $3, expired_at = now(), updated_by = $3, updated_at = now()
     WHERE society_id = $1 AND id = $2 AND status <> 'EXPIRED' RETURNING *`,
    [societyId, id, userId],
  );
  return result.rows[0] || null;
};

const renotify = async (societyId, id) => {
  const result = await db.query(
    `${RECIPIENTS_CTE}, notice AS (
       SELECT * FROM notices WHERE society_id = $1 AND id = $2
         AND status = 'PUBLISHED' AND (expires_at IS NULL OR expires_at > now())
     ), queued AS (
       INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, created_at, updated_at)
       SELECT notice.society_id, recipients.user_id, 'IN_APP', 'OPERATIONAL',
              notice.title, notice.title, notice.description,
              jsonb_build_object('noticeId', notice.id, 'scheduledAt', notice.scheduled_at, 'expiresAt', notice.expires_at), 'NOTICE', notice.id,
              'MEDIUM', 'PENDING', now(), now()
       FROM notice CROSS JOIN recipients
       WHERE recipients.user_id <> COALESCE(notice.created_by, '00000000-0000-0000-0000-000000000000'::uuid)
       RETURNING id
     )
     UPDATE notices SET renotified_at = now(), renotify_count = renotify_count + 1,
       updated_at = now()
     WHERE society_id = $1 AND id = $2 AND status = 'PUBLISHED'
       AND (expires_at IS NULL OR expires_at > now())
     RETURNING *, (SELECT count(*)::int FROM queued) AS queued_count`,
    [societyId, id],
  );
  return result.rows[0] || null;
};

const saveTemplate = async (societyId, createdBy, title, description) => {
  const result = await db.query(
    `INSERT INTO notice_templates (society_id, created_by, title, description)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [societyId, createdBy, title, description],
  );
  return result.rows[0];
};

const listTemplates = async (societyId) => {
  const result = await db.query(
    `SELECT id, title, description, created_by, created_at
     FROM notice_templates WHERE society_id = $1 ORDER BY created_at DESC`,
    [societyId],
  );
  return result.rows;
};

const findTemplate = async (societyId, id) => {
  const result = await db.query(
    'SELECT id, title, description FROM notice_templates WHERE society_id = $1 AND id = $2',
    [societyId, id],
  );
  return result.rows[0] || null;
};

module.exports = { list, findById, create, update, markRead, expire, renotify, saveTemplate, listTemplates, findTemplate, queueNoticeNotifications, queueUpcomingNoticeNotifications, queueNoticeUpdateNotifications, queueNoticeExpiredNotifications, publishDue };
