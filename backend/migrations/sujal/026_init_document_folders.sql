-- =====================================================================
-- Migration 026: Document Folders & Documents
-- Matches DB Architecture doc, Section 22 "Document Vault"
-- Depends on: societies(id), users(id)
--
-- ADDED BEYOND THE BASELINE DOC (explicitly requested):
--   documents.effective_date, documents.expiry_date, documents.visibility
--   These exist in the functional spec's prose (Section 31) but not in
--   the DB doc's own documents table - added here on your explicit
--   instruction, clearly marked so it's not confused with the baseline.
--
-- RETROACTIVE FK FIXES (appended at the end of this file): this is the
-- migration where the documents table itself is finally created, so
-- it's the correct, fresh-install-safe place to retroactively wire up
-- every document_id column that was left as a plain UUID placeholder
-- in an earlier-numbered migration (010, 013, 016, 023, 004) - each of
-- those tables already exists by the time this migration runs.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- document_folders: id, society_id, parent_folder_id (self-ref,
-- nullable), name, folder_type, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_folders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id         UUID NOT NULL REFERENCES societies(id),
  parent_folder_id   UUID REFERENCES document_folders(id),
  name               VARCHAR(150) NOT NULL,
  folder_type        VARCHAR(50) NOT NULL,   -- BYLAWS | RERA | AUDIT_REPORTS | AGM_MINUTES | CONTRACTS | POLICIES | OTHER
  status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- documents: id, society_id, folder_id, document_type, title, file_name,
-- storage_key, mime_type, size_bytes, checksum, sensitivity,
-- uploaded_by, status
-- + effective_date, expiry_date, visibility (added per your request)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id       UUID NOT NULL REFERENCES societies(id),
  folder_id        UUID NOT NULL REFERENCES document_folders(id),
  document_type    VARCHAR(50) NOT NULL,   -- BYLAW | RERA_CERT | AUDIT_REPORT | AGM_MINUTES | CONTRACT | POLICY | OTHER
  title            VARCHAR(255) NOT NULL,
  file_name        VARCHAR(255) NOT NULL,
  storage_key      VARCHAR(500) NOT NULL,   -- relative path on local disk (Option B - multer upload)
  mime_type        VARCHAR(100) NOT NULL,
  size_bytes       BIGINT NOT NULL,
  checksum         VARCHAR(128) NOT NULL,   -- sha256 hex digest, computed server-side on upload
  sensitivity      VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',  -- PUBLIC | INTERNAL | CONFIDENTIAL
  uploaded_by      UUID NOT NULL REFERENCES users(id),
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | ARCHIVED | DELETED
  -- --- added beyond baseline doc, per explicit request ---
  effective_date   DATE,
  expiry_date      DATE,
  visibility       VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',  -- PUBLIC | COMMITTEE_ONLY | PRIVATE
  -- ---------------------------------------------------------
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_folders_society   ON document_folders(society_id);
CREATE INDEX IF NOT EXISTS idx_doc_folders_parent     ON document_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_society      ON documents(society_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder       ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_status        ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by  ON documents(uploaded_by);

-- ---------------------------------------------------------------------
-- Retroactive FKs: every document_id placeholder from earlier
-- migrations, now that documents() exists above. Each referenced
-- table already exists (created in an earlier-numbered migration),
-- so this is safe on a fresh install.
-- ---------------------------------------------------------------------
ALTER TABLE vendor_documents
  ADD CONSTRAINT vendor_documents_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id);

ALTER TABLE vendor_contracts
  ADD CONSTRAINT vendor_contracts_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id);

ALTER TABLE vendor_invoices
  ADD CONSTRAINT vendor_invoices_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id);

ALTER TABLE visitor_profiles
  ADD CONSTRAINT visitor_profiles_photo_document_id_fkey
  FOREIGN KEY (photo_document_id) REFERENCES documents(id);

ALTER TABLE ticket_attachments
  ADD CONSTRAINT ticket_attachments_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id);

ALTER TABLE vehicle_documents
  ADD CONSTRAINT vehicle_documents_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id);
