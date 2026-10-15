-- =====================================================================
-- Migration 024: SLA Timers & Ticket Escalations
-- Matches DB Architecture doc, Section 18 "Helpdesk, SLA & Escalation"
-- Depends on: tickets(id) [023], sla_policies(id), escalation_rules(id)
--             [022], users(id)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- sla_timers: id, ticket_id, sla_policy_id, started_at, paused_at,
-- resumed_at, response_due_at, resolution_due_at, breached_at, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sla_timers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id           UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sla_policy_id       UUID NOT NULL REFERENCES sla_policies(id),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at           TIMESTAMPTZ,
  resumed_at          TIMESTAMPTZ,
  response_due_at     TIMESTAMPTZ,
  resolution_due_at   TIMESTAMPTZ,
  breached_at         TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL DEFAULT 'RUNNING',  -- RUNNING|PAUSED|MET|BREACHED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ticket_escalations: id, ticket_id, escalation_rule_id, escalated_at,
-- escalated_to, acknowledged_at, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_escalations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id            UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  escalation_rule_id   UUID NOT NULL REFERENCES escalation_rules(id),
  escalated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  escalated_to         UUID REFERENCES users(id),  -- resolved target user, if the rule names one
  acknowledged_at      TIMESTAMPTZ,
  status               VARCHAR(20) NOT NULL DEFAULT 'OPEN'  -- OPEN|ACKNOWLEDGED|RESOLVED
);

CREATE INDEX IF NOT EXISTS idx_sla_timers_ticket           ON sla_timers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_timers_status           ON sla_timers(status);
CREATE INDEX IF NOT EXISTS idx_ticket_escalations_ticket   ON ticket_escalations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_escalations_rule     ON ticket_escalations(escalation_rule_id);
