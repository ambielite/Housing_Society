-- =====================================================================
-- Migration 027: Document Versions, Permissions, Links
-- Matches DB Architecture doc, Section 22 "Document Vault"
-- Depends on: documents(id) [026], roles(id), users(id)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- document_versions: id, document_id, version_no, storage_key,
-- checksum, uploaded_by, uploaded_at, change_note
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_no    INTEGER NOT NULL,
  storage_key   VARCHAR(500) NOT NULL,
  checksum      VARCHAR(128) NOT NULL,
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_note   VARCHAR(500)
);

-- ---------------------------------------------------------------------
-- document_permissions: id, document_id, role_id (nullable), user_id
-- (nullable), permission_type, expires_at
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_permissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  role_id           UUID REFERENCES roles(id),
  user_id           UUID REFERENCES users(id),
  permission_type   VARCHAR(20) NOT NULL,   -- READ | DOWNLOAD | MANAGE
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- document_links: id, document_id, entity_type, entity_id, link_type
-- Generic business-document association (e.g. linking a document to a
-- vendor contract, a ticket, a PO - any entity_type/entity_id pair).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  entity_type   VARCHAR(50) NOT NULL,   -- e.g. VENDOR_CONTRACT | TICKET | PURCHASE_ORDER | VISITOR_PROFILE
  entity_id     UUID NOT NULL,
  link_type     VARCHAR(30) NOT NULL DEFAULT 'ATTACHMENT',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_document      ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_permissions_document   ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_permissions_role       ON document_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_doc_permissions_user       ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_links_document         ON document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_links_entity            ON document_links(entity_type, entity_id);
