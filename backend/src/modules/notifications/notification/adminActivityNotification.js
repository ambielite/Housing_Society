const { query } = require("../../../config/db");

const notifySocietyAdmins = async ({
  societyId,
  title,
  message,
  referenceType,
  referenceId,
  data = {},
  excludeUserId = null,
}) => {
  if (!societyId || !title || !message) return;

  try {
    await query(
      `INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
       SELECT DISTINCT $1, u.id, 'IN_APP', 'OPERATIONAL', $2, $2, $3,
              $4::jsonb, $5, $6::uuid, 'MEDIUM', 'PENDING', false, now(), now()
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id AND r.status = 'ACTIVE'
        WHERE u.status = 'ACTIVE'
          AND r.code IN ('SOCIETY_ADMIN', 'SUPER_ADMIN', 'PRESIDENT_SECRETARY')
          AND (ur.society_id = $1 OR (r.code = 'SUPER_ADMIN' AND ur.society_id IS NULL))
          AND ($7::uuid IS NULL OR u.id <> $7)`,
      [
        societyId,
        title,
        message,
        JSON.stringify(data),
        referenceType || null,
        referenceId || null,
        excludeUserId,
      ],
    );
  } catch (error) {
    // Notification delivery must not roll back the resident or ticket action.
    console.error("Could not notify society admins about resident activity:", error);
  }
};

module.exports = { notifySocietyAdmins };
