-- Store a visitor category and optional delivery service on visitor profiles.
ALTER TABLE visitor_profiles
  ADD COLUMN IF NOT EXISTS visitor_type VARCHAR(30) NOT NULL DEFAULT 'GUEST',
  ADD COLUMN IF NOT EXISTS delivery_company VARCHAR(100);
