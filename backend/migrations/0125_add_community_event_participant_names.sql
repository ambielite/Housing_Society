ALTER TABLE community_event_rsvps
  ADD COLUMN IF NOT EXISTS participant_names JSONB NOT NULL DEFAULT '[]'::jsonb;
