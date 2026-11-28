const { query } = require("../../../config/db");
const residentDashboardEvents = require("../../resident-dashboard/residentDashboardEvents");

const notifyResidentUser = async ({
  societyId,
  userId,
  title,
  message,
  referenceType,
  referenceId,
  data = {},
}) => {
  if (!societyId || !userId || !title || !message) return;
  try {
    await query(
      `INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
       VALUES ($1, $2, 'IN_APP', 'OPERATIONAL', $3, $3, $4,
               $5::jsonb, $6, $7::uuid, 'MEDIUM', 'PENDING', false, now(), now())`,
      [societyId, userId, title, message, JSON.stringify(data), referenceType || null, referenceId || null],
    );
    residentDashboardEvents.publishToUser(userId, "resident-updated");
  } catch (error) {
    console.error("Could not notify resident about activity:", error);
  }
};

const notifySocietyResidents = async ({
  societyId,
  title,
  message,
  referenceType,
  referenceId,
  data = {},
}) => {
  if (!societyId || !title || !message) return;
  try {
    const result = await query(
      `WITH recipients AS (
         SELECT DISTINCT u.id AS user_id
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id AND r.code IN ('RESIDENT_APP', 'RESIDENT') AND r.status = 'ACTIVE'
          WHERE u.society_id = $1 AND u.status = 'ACTIVE'
            AND (ur.society_id = $1 OR ur.society_id IS NULL)
       )
       INSERT INTO notifications
         (society_id, user_id, channel, notification_type, title, subject, message,
          data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
       SELECT $1, recipients.user_id, 'IN_APP', 'OPERATIONAL', $2, $2, $3,
              $4::jsonb, $5, $6::uuid, 'MEDIUM', 'PENDING', false, now(), now()
         FROM recipients
       RETURNING user_id`,
      [societyId, title, message, JSON.stringify(data), referenceType || null, referenceId || null],
    );
    residentDashboardEvents.publishToUsers(result.rows.map((row) => row.user_id), "resident-updated");
  } catch (error) {
    console.error("Could not notify society residents about activity:", error);
  }
};

module.exports = { notifyResidentUser, notifySocietyResidents };
