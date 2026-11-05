-- Keep the intended home with a walk-in visitor pass.
ALTER TABLE visitor_passes
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES residents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visitor_passes_unit ON visitor_passes(unit_id);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_resident ON visitor_passes(resident_id);
