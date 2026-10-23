const db = require('../../config/db');

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

const queueNoticeNotifications = async (societyId, notice) => {
  const result = await db.query(
    `${RECIPIENTS_CTE}
     INSERT INTO notifications
       (society_id, user_id, channel, notification_type, title, subject, message,
        data, reference_type, reference_id, priority, status, created_at, updated_at)
     SELECT $1, recipients.user_id, 'IN_APP', 'OPERATIONAL', $2, $2, $3,
            jsonb_build_object('noticeId', $4), 'NOTICE', $4,
            'MEDIUM', 'PENDING', now(), now()
     FROM recipients
     RETURNING id`,
    [societyId, notice.title, notice.description, notice.id],
  );
  return result.rowCount || 0;
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
  if (!isScheduled) notice.queued_count = await queueNoticeNotifications(societyId, notice);
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
       RETURNING id, society_id, title, description
     ), recipients AS (
       SELECT due.id AS notice_id, due.society_id, due.title, due.description, users.id AS user_id
       FROM due JOIN users ON users.society_id = due.society_id AND users.status = 'ACTIVE'
       UNION
       SELECT due.id, due.society_id, due.title, due.description, usa.user_id
       FROM due JOIN user_society_access usa ON usa.society_id = due.society_id
       WHERE usa.active_from <= now() AND (usa.active_until IS NULL OR usa.active_until > now())
       UNION
       SELECT due.id, due.society_id, due.title, due.description, sa.user_id
       FROM due JOIN society_accesses sa ON sa.society_id = due.society_id AND sa.is_active = true
       WHERE (sa.valid_from IS NULL OR sa.valid_from <= now())
         AND (sa.valid_until IS NULL OR sa.valid_until > now())
     ), queued AS (
       INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, created_at, updated_at)
       SELECT society_id, user_id, 'IN_APP', 'OPERATIONAL', title, title, description,
              jsonb_build_object('noticeId', notice_id), 'NOTICE', notice_id,
              'MEDIUM', 'PENDING', now(), now()
       FROM recipients RETURNING id
     ), expired AS (
       UPDATE notices SET status = 'EXPIRED', expired_at = COALESCE(expired_at, expires_at), updated_at = now()
       WHERE status IN ('PUBLISHED', 'SCHEDULED') AND expires_at IS NOT NULL AND expires_at <= now()
       RETURNING id
     )
     SELECT (SELECT count(*)::int FROM due) AS published_count,
            (SELECT count(*)::int FROM queued) AS queued_count,
            (SELECT count(*)::int FROM expired) AS expired_count`,
  );
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
              jsonb_build_object('noticeId', notice.id), 'NOTICE', notice.id,
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

module.exports = { list, findById, create, update, markRead, expire, renotify, saveTemplate, listTemplates, findTemplate, queueNoticeNotifications, publishDue };
