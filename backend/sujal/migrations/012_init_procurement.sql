-- =====================================================================
-- Migration 012: Purchase Requests, RFQs, Quotations, Comparison
-- Matches DB Architecture doc, Section 11 "Vendors & Procurement"
-- Depends on: societies(id), users(id), vendors(id) [migration 010]
--
-- Placeholder (nullable, NO foreign key - table doesn't exist yet):
--   purchase_request_lines.asset_category_id -> Phase 11 (Assets)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- purchase_requests: id, society_id, requested_by, request_no (unique),
-- requested_date, department, justification, estimated_amount, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id        UUID NOT NULL REFERENCES societies(id),
  requested_by      UUID NOT NULL REFERENCES users(id),
  request_no        VARCHAR(50) NOT NULL,
  requested_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  department        VARCHAR(100),
  justification     TEXT,
  estimated_amount  NUMERIC(14, 2),
  status            VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT|SUBMITTED|QUOTATION|APPROVAL|APPROVED|REJECTED|PO_ISSUED|CANCELLED
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (society_id, request_no)
);

-- ---------------------------------------------------------------------
-- purchase_request_lines: id, purchase_request_id, item_description,
-- quantity, estimated_unit_cost, asset_category_id (nullable, placeholder)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_request_lines (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id   UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  item_description      VARCHAR(255) NOT NULL,
  quantity              NUMERIC(12, 2) NOT NULL,
  estimated_unit_cost   NUMERIC(14, 2),
  asset_category_id     UUID  -- no FK yet: Phase 11 Assets not built
);

-- ---------------------------------------------------------------------
-- rfqs: id, purchase_request_id, rfq_no (unique), issue_date, due_date, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rfqs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id  UUID NOT NULL REFERENCES purchase_requests(id),
  rfq_no               VARCHAR(50) NOT NULL UNIQUE,
  issue_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date             DATE,
  status               VARCHAR(20) NOT NULL DEFAULT 'OPEN',  -- OPEN|CLOSED
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- rfq_vendors: rfq_id, vendor_id, invited_at, response_status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rfq_vendors (
  rfq_id            UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id         UUID NOT NULL REFERENCES vendors(id),
  invited_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_status   VARCHAR(20) NOT NULL DEFAULT 'INVITED',  -- INVITED|RESPONDED|DECLINED
  PRIMARY KEY (rfq_id, vendor_id)
);

-- ---------------------------------------------------------------------
-- quotations: id, rfq_id, vendor_id, quotation_no, quotation_date,
-- valid_until, subtotal, tax, total, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID NOT NULL REFERENCES rfqs(id),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  quotation_no    VARCHAR(50) NOT NULL,
  quotation_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until     DATE,
  subtotal        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',  -- SUBMITTED|ACCEPTED|REJECTED
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, vendor_id)
);

-- ---------------------------------------------------------------------
-- quotation_lines: id, quotation_id, description, quantity, unit_price,
-- tax, total
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_lines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id   UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  description    VARCHAR(255) NOT NULL,
  quantity       NUMERIC(12, 2) NOT NULL,
  unit_price     NUMERIC(14, 2) NOT NULL,
  tax            NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total          NUMERIC(14, 2) NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- quotation_comparisons: id, rfq_id, criterion, vendor_id, score, remarks
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_comparisons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  criterion   VARCHAR(100) NOT NULL,
  vendor_id   UUID NOT NULL REFERENCES vendors(id),
  score       NUMERIC(5, 2),
  remarks     VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_society               ON purchase_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_pr_status                ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_lines_request          ON purchase_request_lines(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_request              ON rfqs(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_rfq_vendors_vendor        ON rfq_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quotations_rfq            ON quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotation_lines_quotation ON quotation_lines(quotation_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_rfq           ON quotation_comparisons(rfq_id);
