-- =====================================================================
-- MANUAL SQL - run this directly against your already-migrated database.
-- `npm run migrate` will NOT pick up the file edits above, since those
-- migrations are already marked applied in your schema_migrations table.
--
-- Safe to run top-to-bottom in one go via psql/pgAdmin. Every ADD
-- CONSTRAINT is wrapped so it will not error out if run twice (e.g. if
-- you re-run this script after a partial failure).
-- =====================================================================


-- =====================================================================
-- SECTION 0 - VALIDATION *BEFORE* (run this first, read the results)
-- =====================================================================
-- Each of these should return 0 rows. If any return rows, STOP and
-- show me the output before continuing - it means there's a genuine
-- orphaned document_id/sla_policy_id/visitor_id value that needs a
-- decision (not something to silently fix).

SELECT 'vendor_documents' AS table_name, vd.id, vd.document_id
FROM vendor_documents vd
LEFT JOIN documents d ON d.id = vd.document_id
WHERE vd.document_id IS NOT NULL AND d.id IS NULL;

SELECT 'vendor_contracts.document_id' AS table_name, vc.id, vc.document_id
FROM vendor_contracts vc
LEFT JOIN documents d ON d.id = vc.document_id
WHERE vc.document_id IS NOT NULL AND d.id IS NULL;

SELECT 'vendor_contracts.sla_policy_id' AS table_name, vc.id, vc.sla_policy_id
FROM vendor_contracts vc
LEFT JOIN sla_policies sp ON sp.id = vc.sla_policy_id
WHERE vc.sla_policy_id IS NOT NULL AND sp.id IS NULL;

SELECT 'vendor_invoices' AS table_name, vi.id, vi.document_id
FROM vendor_invoices vi
LEFT JOIN documents d ON d.id = vi.document_id
WHERE vi.document_id IS NOT NULL AND d.id IS NULL;

SELECT 'visitor_profiles' AS table_name, vp.id, vp.photo_document_id
FROM visitor_profiles vp
LEFT JOIN documents d ON d.id = vp.photo_document_id
WHERE vp.photo_document_id IS NOT NULL AND d.id IS NULL;

SELECT 'ticket_attachments' AS table_name, ta.id, ta.document_id
FROM ticket_attachments ta
LEFT JOIN documents d ON d.id = ta.document_id
WHERE ta.document_id IS NOT NULL AND d.id IS NULL;
-- Expected: 0 rows, per your confirmation that you never sent a
-- documentId during Phase 13 testing (all should already be NULL).

SELECT 'parking_visits' AS table_name, pv.id, pv.visitor_id
FROM parking_visits pv
LEFT JOIN visitor_profiles vp ON vp.id = pv.visitor_id
WHERE pv.visitor_id IS NOT NULL AND vp.id IS NULL;

-- Also confirm none of these constraints already exist (should be 0 rows -
-- if any DO show up, someone already applied part of this fix):
SELECT conname FROM pg_constraint
WHERE conname IN (
  'vendor_documents_document_id_fkey',
  'vendor_contracts_document_id_fkey',
  'vendor_contracts_sla_policy_id_fkey',
  'vendor_invoices_document_id_fkey',
  'visitor_profiles_photo_document_id_fkey',
  'ticket_attachments_document_id_fkey',
  'vehicle_documents_document_id_fkey',
  'parking_visits_visitor_id_fkey'
);


-- =====================================================================
-- SECTION 1 - CREATE THE NEW vehicle_documents TABLE
-- This table does not exist in your database yet. Both vehicles and
-- documents already exist, so the FKs are added inline directly -
-- no placeholder/retrofit needed since this table is brand new.
-- =====================================================================

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id           UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_id          UUID REFERENCES documents(id),
  document_type        VARCHAR(50) NOT NULL,
  expiry_date          DATE,
  verification_status  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_veh ON vehicle_documents(vehicle_id);


-- =====================================================================
-- SECTION 2 - SAFETY-NULL ANY ORPHANED VALUES, THEN ADD EACH CONSTRAINT
-- The UPDATE statements are a no-op (affect 0 rows) if Section 0 above
-- returned 0 rows for that table, which is what's expected. They exist
-- only as a safety net - they do NOT invent or insert any new values,
-- they only clear a dangling reference if one somehow exists.
-- =====================================================================

-- --- vendor_documents.document_id -> documents.id ---
UPDATE vendor_documents SET document_id = NULL
WHERE document_id IS NOT NULL AND document_id NOT IN (SELECT id FROM documents);

DO $$ BEGIN
  ALTER TABLE vendor_documents
    ADD CONSTRAINT vendor_documents_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- vendor_contracts.document_id -> documents.id ---
UPDATE vendor_contracts SET document_id = NULL
WHERE document_id IS NOT NULL AND document_id NOT IN (SELECT id FROM documents);

DO $$ BEGIN
  ALTER TABLE vendor_contracts
    ADD CONSTRAINT vendor_contracts_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- vendor_contracts.sla_policy_id -> sla_policies.id ---
UPDATE vendor_contracts SET sla_policy_id = NULL
WHERE sla_policy_id IS NOT NULL AND sla_policy_id NOT IN (SELECT id FROM sla_policies);

DO $$ BEGIN
  ALTER TABLE vendor_contracts
    ADD CONSTRAINT vendor_contracts_sla_policy_id_fkey
    FOREIGN KEY (sla_policy_id) REFERENCES sla_policies(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- vendor_invoices.document_id -> documents.id ---
UPDATE vendor_invoices SET document_id = NULL
WHERE document_id IS NOT NULL AND document_id NOT IN (SELECT id FROM documents);

DO $$ BEGIN
  ALTER TABLE vendor_invoices
    ADD CONSTRAINT vendor_invoices_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- visitor_profiles.photo_document_id -> documents.id ---
UPDATE visitor_profiles SET photo_document_id = NULL
WHERE photo_document_id IS NOT NULL AND photo_document_id NOT IN (SELECT id FROM documents);

DO $$ BEGIN
  ALTER TABLE visitor_profiles
    ADD CONSTRAINT visitor_profiles_photo_document_id_fkey
    FOREIGN KEY (photo_document_id) REFERENCES documents(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- ticket_attachments.document_id -> documents.id ---
-- (expected to be a true no-op per your confirmation - all NULL already)
UPDATE ticket_attachments SET document_id = NULL
WHERE document_id IS NOT NULL AND document_id NOT IN (SELECT id FROM documents);

DO $$ BEGIN
  ALTER TABLE ticket_attachments
    ADD CONSTRAINT ticket_attachments_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- parking_visits.visitor_id -> visitor_profiles.id ---
UPDATE parking_visits SET visitor_id = NULL
WHERE visitor_id IS NOT NULL AND visitor_id NOT IN (SELECT id FROM visitor_profiles);

DO $$ BEGIN
  ALTER TABLE parking_visits
    ADD CONSTRAINT parking_visits_visitor_id_fkey
    FOREIGN KEY (visitor_id) REFERENCES visitor_profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =====================================================================
-- SECTION 3 - VALIDATION *AFTER* (run this last, confirm the results)
-- =====================================================================

-- 3a. All 8 constraints should now exist (expect 8 rows back):
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE conname IN (
  'vendor_documents_document_id_fkey',
  'vendor_contracts_document_id_fkey',
  'vendor_contracts_sla_policy_id_fkey',
  'vendor_invoices_document_id_fkey',
  'visitor_profiles_photo_document_id_fkey',
  'ticket_attachments_document_id_fkey',
  'vehicle_documents_document_id_fkey',
  'parking_visits_visitor_id_fkey'
)
ORDER BY conname;

-- 3b. Re-run every query from Section 0 - all should still return 0 rows
-- (proves no orphans remain and nothing broke).

-- 3c. Confirm NULL-ability was preserved (nullable columns should still
-- allow NULL; this just confirms the column definition, not data):
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE (table_name, column_name) IN (
  ('vendor_documents', 'document_id'),
  ('vendor_contracts', 'document_id'),
  ('vendor_contracts', 'sla_policy_id'),
  ('vendor_invoices', 'document_id'),
  ('visitor_profiles', 'photo_document_id'),
  ('ticket_attachments', 'document_id'),
  ('vehicle_documents', 'document_id'),
  ('parking_visits', 'visitor_id')
)
ORDER BY table_name, column_name;
-- Expect is_nullable = 'YES' for every row - confirms nothing was
-- accidentally tightened to NOT NULL.

-- 3d. Confirm vehicle_documents table exists and is empty (brand new):
SELECT COUNT(*) AS row_count FROM vehicle_documents;
-- Expect 0 (or however many rows you've since added through the API).
