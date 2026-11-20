ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS visitor_pass_id UUID REFERENCES visitor_passes(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_visitor_pass
  ON deliveries(visitor_pass_id)
  WHERE visitor_pass_id IS NOT NULL;
