-- =====================================================================
-- Migration 028: Document Download Audit
-- ADDED BEYOND THE BASELINE DOC (explicitly requested): the functional
-- spec (Section 31) says "Download audit" but Section 22's 5-table
-- list has no backing table for it. This is a genuinely new table, not
-- present in the DB Architecture doc at all - added only because you
-- explicitly asked for it.
-- Depends on: documents(id) [026], users(id)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS document_downloads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  downloaded_by  UUID NOT NULL REFERENCES users(id),
  downloaded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address     VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_doc_downloads_document  ON document_downloads(document_id, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_downloads_user       ON document_downloads(downloaded_by);
