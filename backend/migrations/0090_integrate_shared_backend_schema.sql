-- Bridge the existing teammate schema to the Sujal modules without replacing
-- tables or discarding IDs referenced by existing foreign keys.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address_id UUID;

UPDATE vendors
SET legal_name = COALESCE(NULLIF(legal_name, ''), NULLIF(company_name, ''), NULLIF(vendor_code, ''), 'Legacy vendor ' || id::text)
WHERE legal_name IS NULL OR legal_name = '';

UPDATE vendors
SET contact_email = COALESCE(contact_email, email)
WHERE contact_email IS NULL;

ALTER TABLE vendors ALTER COLUMN vendor_code DROP NOT NULL;
ALTER TABLE vendors ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE vendors ALTER COLUMN legal_name SET NOT NULL;
ALTER TABLE vendors ALTER COLUMN status DROP DEFAULT;
ALTER TABLE vendors ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
ALTER TABLE vendors ALTER COLUMN status SET DEFAULT 'PENDING';
ALTER TABLE vendors ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE vendors ALTER COLUMN updated_at SET DEFAULT now();

-- Sujal's feature tables scope units by society. Derive this from the
-- existing floor -> tower relationship, preserving the original unit IDs.
ALTER TABLE units ADD COLUMN IF NOT EXISTS society_id UUID;

UPDATE units AS u
SET society_id = t.society_id
FROM floors AS f
JOIN towers AS t ON t.id = f.tower_id
WHERE u.floor_id = f.id AND u.society_id IS NULL;

CREATE INDEX IF NOT EXISTS units_society_id ON units (society_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'units_society_id_societies_fk'
  ) THEN
    ALTER TABLE units
      ADD CONSTRAINT units_society_id_societies_fk
      FOREIGN KEY (society_id) REFERENCES societies(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;
