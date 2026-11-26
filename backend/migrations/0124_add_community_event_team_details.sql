ALTER TABLE community_event_rsvps
  ADD COLUMN IF NOT EXISTS team_name VARCHAR(120);
