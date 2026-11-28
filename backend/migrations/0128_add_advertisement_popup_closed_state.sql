ALTER TABLE advertisement_resident_state
  ADD COLUMN IF NOT EXISTS popup_closed_at TIMESTAMPTZ;
