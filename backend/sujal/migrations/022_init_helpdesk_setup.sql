-- =====================================================================
-- Migration 022: Helpdesk Setup - SLA policies, ticket categories,
-- escalation rules
-- Matches DB Architecture doc, Section 18 "Helpdesk, SLA & Escalation"
-- Depends on: societies(id), roles(id), users(id) [all Phase 1]
--
-- vendor_contracts.sla_policy_id (from migration 010): THIS migration
-- is where sla_policies is actually created, and vendor_contracts
-- already exists from migration 010 by the time this one runs - so
-- this is the correct, fresh-install-safe place to add that retroactive
-- FK constraint. See the ALTER TABLE statement at the end of this file.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- sla_policies: id, society_id, name, response_minutes,
-- resolution_minutes, pause_on_waiting, status
-- (created first - ticket_categories and escalation_rules both
-- reference it)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sla_policies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id           UUID NOT NULL REFERENCES societies(id),
  name                 VARCHAR(150) NOT NULL,
  response_minutes     INTEGER NOT NULL,
  resolution_minutes   INTEGER NOT NULL,
  pause_on_waiting     BOOLEAN NOT NULL DEFAULT true,
  status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ticket_categories: id, society_id, parent_category_id (self-ref,
-- nullable), name, code, default_priority, sla_policy_id, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_categories (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id           UUID NOT NULL REFERENCES societies(id),
  parent_category_id   UUID REFERENCES ticket_categories(id),
  name                 VARCHAR(150) NOT NULL,
  code                 VARCHAR(50) NOT NULL,
  default_priority     VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',  -- CRITICAL|HIGH|MEDIUM|LOW
  sla_policy_id        UUID REFERENCES sla_policies(id),
  status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- escalation_rules: id, sla_policy_id, threshold_type, threshold_value,
-- escalation_level, target_role_id, target_user_id (nullable)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escalation_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_policy_id       UUID NOT NULL REFERENCES sla_policies(id) ON DELETE CASCADE,
  threshold_type      VARCHAR(30) NOT NULL,   -- WARNING_BEFORE_BREACH | AT_BREACH | MINUTES_AFTER_BREACH
  threshold_value     INTEGER NOT NULL DEFAULT 0,  -- minutes, meaning depends on threshold_type
  escalation_level    INTEGER NOT NULL,   -- 1 = Tier 1 (e.g. Facility Manager), 2 = Tier 2 (e.g. President/Secretary)
  target_role_id      UUID NOT NULL REFERENCES roles(id),
  target_user_id      UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sla_policies_society        ON sla_policies(society_id);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_society   ON ticket_categories(society_id);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_parent    ON ticket_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_policy     ON escalation_rules(sla_policy_id, escalation_level);

-- ---------------------------------------------------------------------
-- Retroactive FK: vendor_contracts.sla_policy_id -> sla_policies(id)
-- vendor_contracts was created in migration 010, before sla_policies
-- existed. Added here, now that sla_policies exists above, and safely
-- after vendor_contracts already exists from migration 010.
-- ---------------------------------------------------------------------
ALTER TABLE vendor_contracts
  ADD CONSTRAINT vendor_contracts_sla_policy_id_fkey
  FOREIGN KEY (sla_policy_id) REFERENCES sla_policies(id);
