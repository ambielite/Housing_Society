const cron = require('node-cron');
const { getClient } = require('../config/db');
const residentDashboardEvents = require('../modules/resident-dashboard/residentDashboardEvents');

const processKidsActivityRegistrationDeadlines = async () => {
  const client = await getClient();
  let affectedUserIds = [];
  let expiredCount = 0;
  try {
    await client.query('BEGIN');
    const expired = await client.query(
      `WITH due AS (
         SELECT id FROM kids_activities
          WHERE registration_required = TRUE AND registration_deadline <= now()
            AND registration_expired_at IS NULL AND status = 'OPEN'
          ORDER BY registration_deadline
          LIMIT 100 FOR UPDATE SKIP LOCKED
       )
       UPDATE kids_activities activity
          SET registration_expired_at = now(), updated_at = now()
         FROM due WHERE activity.id = due.id
       RETURNING activity.id, activity.society_id, activity.name,
                 activity.registration_deadline, activity.created_by`,
    );
    expiredCount = expired.rows.length;

    for (const activity of expired.rows) {
      const notices = await client.query(
        `WITH recipients AS (
           SELECT user_id FROM notifications
            WHERE society_id = $1 AND reference_type = 'KIDS_ACTIVITY' AND reference_id = $2::uuid
           UNION SELECT created_by FROM kids_activities WHERE id = $2::uuid AND society_id = $1
         )
         INSERT INTO notifications
           (society_id, user_id, channel, notification_type, title, subject, message, data,
            reference_type, reference_id, priority, status, created_at, updated_at)
         SELECT $1, recipients.user_id, 'IN_APP', 'OPERATIONAL', $3, $3, $4,
                jsonb_build_object('activityId', $2::uuid, 'registrationDeadline', $5::timestamptz,
                  'registrationExpired', true),
                'KIDS_ACTIVITY', $2::uuid, 'MEDIUM', 'PENDING', now(), now()
           FROM recipients WHERE recipients.user_id IS NOT NULL
         ON CONFLICT DO NOTHING RETURNING user_id`,
        [activity.society_id, activity.id, `Registration expired: ${activity.name}`, `The registration form for ${activity.name} has expired. Registration is now closed.`, activity.registration_deadline],
      );
      affectedUserIds.push(...notices.rows.map((row) => row.user_id));
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  residentDashboardEvents.publishToUsers(affectedUserIds, 'kids-activity-published');
  return expiredCount;
};

const startKidsActivityRegistrationDeadlineJob = () => {
  const run = () => processKidsActivityRegistrationDeadlines()
    .catch((error) => console.error('Kids activity registration deadline job failed:', error.message));
  void run();
  cron.schedule('* * * * *', run);
  console.log('Kids activity registration deadline job started');
};

module.exports = { startKidsActivityRegistrationDeadlineJob, processKidsActivityRegistrationDeadlines };
