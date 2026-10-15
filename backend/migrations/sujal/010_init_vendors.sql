-- =====================================================================
-- Migration 010: Vendors & related master data
-- Matches DB Architecture doc, Section 11 "Vendors & Procurement"
-- Depends on: societies(id) [teammate's Phase 2], addresses(id) [Phase 1]
--
-- vendor_documents.document_id and vendor_contracts.document_id: both
-- Document Vault (documents table) and SLA policies (sla_policies
-- table) now exist, but this migration runs BEFORE both of them
-- (documents is created in migration 026, sla_policies in migration
-- 022). An inline FK here would break a fresh install. Both columns
-- stay plain UUID in this file; the real FK constraints are added via
-- ALTER TABLE at the end of migration 026 (document_id) and migration
-- 022 (sla_policy_id), once those tables exist.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- vendors: id, society_id, legal_name, trade_name, pan, gstin,
-- contact_email, phone, address_id, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id     UUID NOT NULL REFERENCES societies(id),
  user_id        UUID REFERENCES users(id),  -- links a VENDOR-role login to this vendor record (see vendors.repository.findByUserId)
  legal_name     VARCHAR(255) NOT NULL,
  trade_name     VARCHAR(255),
  pan            VARCHAR(20),
  gstin          VARCHAR(20),
  contact_email  VARCHAR(255),
  phone          VARCHAR(20),
  address_id     UUID REFERENCES addresses(id),
  status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING|ACTIVE|SUSPENDED|BLACKLISTED|EXPIRED|ARCHIVED
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- vendor_contacts: id, vendor_id, name, designation, email, phone, is_primary
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  designation  VARCHAR(100),
  email        VARCHAR(255),
  phone        VARCHAR(20),
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- vendor_documents: id, vendor_id, document_id, document_type,
-- expiry_date, verification_status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_documents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  document_id          UUID,  -- FK to documents(id) added at the end of migration 026
  document_type        VARCHAR(50) NOT NULL,
  expiry_date          DATE,
  verification_status  VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING|VERIFIED|REJECTED
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- vendor_bank_accounts: id, vendor_id, bank_name, account_no_masked,
-- ifsc, beneficiary_name, verified_at, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_bank_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  bank_name           VARCHAR(150),
  account_no_masked   VARCHAR(50),
  ifsc                VARCHAR(20),
  beneficiary_name    VARCHAR(150),
  verified_at         TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING|VERIFIED|REJECTED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- vendor_contracts: id, vendor_id, contract_no, start_date, end_date,
-- value, payment_terms, sla_policy_id, document_id, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contract_no     VARCHAR(50) NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE,
  value           NUMERIC(14, 2),
  payment_terms   VARCHAR(255),
  sla_policy_id   UUID,  -- FK to sla_policies(id) added at the end of migration 022
  document_id     UUID,  -- FK to documents(id) added at the end of migration 026
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|EXPIRED|TERMINATED
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_society          ON vendors(society_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status            ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_user              ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor    ON vendor_contacts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor   ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bank_accts_vendor  ON vendor_bank_accounts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_vendor   ON vendor_contracts(vendor_id);
