ALTER TABLE kids_activities
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

ALTER TABLE kids_activities
  ALTER COLUMN description DROP DEFAULT;
