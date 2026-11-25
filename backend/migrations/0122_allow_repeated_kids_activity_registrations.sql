ALTER TABLE kids_activity_registrations
  DROP CONSTRAINT IF EXISTS kids_activity_registrations_activity_id_user_id_key;

CREATE INDEX IF NOT EXISTS kids_activity_registrations_activity_user_idx
  ON kids_activity_registrations (activity_id, user_id, created_at DESC);
