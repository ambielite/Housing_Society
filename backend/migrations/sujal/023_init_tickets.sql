-- =====================================================================
-- Migration 023: Tickets and their sub-records
-- Matches DB Architecture doc, Section 18 "Helpdesk, SLA & Escalation"
-- Depends on: societies(id), units(id), users(id), vendors(id) [Phase 8],
--             ticket_categories(id) [022]
--
-- ticket_attachments.document_id: Document Vault now exists, but this
-- migration runs BEFORE migration 026 (where documents is created) -
-- an inline FK here would break a fresh install. Stays plain UUID
-- here; the real FK constraint is added via ALTER TABLE at the end of
-- migration 026.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- tickets: id, society_id, ticket_no (unique), category_id, raised_by,
-- unit_id (nullable - a ticket can be for a common area, not a unit),
-- subject, description, priority, status, opened_at, resolved_at,
-- closed_at
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id     UUID NOT NULL REFERENCES societies(id),
  ticket_no      VARCHAR(50) NOT NULL UNIQUE,
  category_id    UUID NOT NULL REFERENCES ticket_categories(id),
  raised_by      UUID NOT NULL REFERENCES users(id),
  unit_id        UUID REFERENCES units(id),
  subject        VARCHAR(255) NOT NULL,
  description    TEXT,
  priority       VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',  -- CRITICAL|HIGH|MEDIUM|LOW
  status         VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  -- OPEN|ASSIGNED|IN_PROGRESS|ON_HOLD|RESOLVED|CLOSED
  opened_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ticket_assignments: id, ticket_id, assigned_to_user_id (nullable),
-- assigned_vendor_id (nullable), assigned_at, unassigned_at
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id             UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  assigned_to_user_id   UUID REFERENCES users(id),
  assigned_vendor_id    UUID REFERENCES vendors(id),
  assigned_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at         TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- ticket_comments: id, ticket_id, author_id, comment, is_internal,
-- created_at
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES users(id),
  comment       TEXT NOT NULL,
  is_internal   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ticket_attachments: id, ticket_id, document_id
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  document_id   UUID,  -- FK to documents(id) added at the end of migration 026
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ticket_status_history: id, ticket_id, old_status, new_status,
-- changed_by, changed_at, remarks
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_status_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  old_status    VARCHAR(20),
  new_status    VARCHAR(20) NOT NULL,
  changed_by    UUID REFERENCES users(id),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  remarks       VARCHAR(500)
);

-- ---------------------------------------------------------------------
-- ticket_ratings: id, ticket_id (unique), rated_by, rating, comment
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID NOT NULL UNIQUE REFERENCES tickets(id),
  rated_by      UUID NOT NULL REFERENCES users(id),
  rating        INTEGER NOT NULL,
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_society          ON tickets(society_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status            ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category          ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_raised_by         ON tickets(raised_by);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket ON ticket_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_vendor ON ticket_assignments(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket    ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_hist_ticket ON ticket_status_history(ticket_id);
