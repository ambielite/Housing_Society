ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS family_owner_id UUID
  REFERENCES residents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS residents_family_owner_idx
  ON residents (family_owner_id)
  WHERE family_owner_id IS NOT NULL;
