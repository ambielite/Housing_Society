ALTER TABLE kids_activities
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_expired_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS kids_activities_registration_deadline_idx
  ON kids_activities (registration_deadline)
  WHERE registration_required = TRUE AND registration_expired_at IS NULL;
