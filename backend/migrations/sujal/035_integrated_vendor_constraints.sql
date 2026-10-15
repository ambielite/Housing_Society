-- Add these constraints after the shared identity and address tables exist.
-- Existing vendor IDs and foreign keys from teammate tables are preserved.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendors_user_id_users_fk'
  ) THEN
    ALTER TABLE vendors
      ADD CONSTRAINT vendors_user_id_users_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendors_address_id_addresses_fk'
  ) THEN
    ALTER TABLE vendors
      ADD CONSTRAINT vendors_address_id_addresses_fk
      FOREIGN KEY (address_id) REFERENCES addresses(id) ON UPDATE CASCADE ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;
