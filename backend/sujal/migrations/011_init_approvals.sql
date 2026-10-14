-- =====================================================================
-- Migration 011: Generic Approval Workflow
-- Matches DB Architecture doc, Section 11 - "approval_requests /
-- approval_actions" is explicitly a GENERIC workflow ("Generic approval
-- workflow" per the doc), reused by any entity_type (purchase requests,
-- purchase orders, vendor invoices, etc.), not hardcoded to procurement.
-- Depends on: societies(id), users(id)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- approval_requests: id, society_id, entity_type, entity_id,
-- approval_type, current_level, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id       UUID NOT NULL REFERENCES societies(id),
  entity_type      VARCHAR(50) NOT NULL,   -- e.g. PURCHASE_REQUEST | PURCHASE_ORDER | VENDOR_INVOICE
  entity_id        UUID NOT NULL,
  approval_type    VARCHAR(50) NOT NULL,   -- e.g. STANDARD | EXPENSE_THRESHOLD
  current_level    INTEGER NOT NULL DEFAULT 1,
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING|APPROVED|REJECTED|INFO_REQUIRED|CANCELLED
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- approval_actions: id, approval_request_id, approver_id, level,
-- decision, remarks, action_at
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_actions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id   UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  approver_id           UUID NOT NULL REFERENCES users(id),
  level                 INTEGER NOT NULL,
  decision              VARCHAR(20) NOT NULL,  -- APPROVE|REJECT|INFO_REQUESTED
  remarks               VARCHAR(500),
  action_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_entity   ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_society  ON approval_requests(society_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request   ON approval_actions(approval_request_id);
