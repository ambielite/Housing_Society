WITH ranked_notice_notifications AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY society_id, user_id, reference_id
           ORDER BY created_at DESC, id DESC
         ) AS row_number
    FROM notifications
   WHERE reference_type = 'NOTICE'
     AND reference_id IS NOT NULL
)
DELETE FROM notifications notification
 USING ranked_notice_notifications ranked
 WHERE notification.id = ranked.id
   AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_notice_recipient_unique
  ON notifications (society_id, user_id, reference_id)
  WHERE reference_type = 'NOTICE'
    AND reference_id IS NOT NULL;
