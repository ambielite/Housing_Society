-- =====================================================================
-- Migration 016: Visitor Lifecycle
-- Matches DB Architecture doc, Section 13
-- Depends on: societies(id), units(id), users(id), gates(id) [015],
--             vehicles(id) [our Phase 4]
--
-- visitor_profiles.photo_document_id: Document Vault now exists, but
-- this migration runs BEFORE migration 026 (where documents is
-- created) - an inline FK here would break a fresh install. Stays
-- plain UUID here; the real FK constraint is added via ALTER TABLE at
-- the end of migration 026.
--
-- parking_visits.visitor_id (from migration 004): THIS migration is
-- where visitor_profiles is actually created, and parking_visits
-- already exists from migration 004 by the time this one runs - so
-- this is the correct, fresh-install-safe place to add that retroactive
-- FK constraint. See the ALTER TABLE statement at the end of this file.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- visitor_profiles: id, society_id, name, phone, id_type,
-- id_number_masked, vehicle_no, photo_document_id, blacklist_status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitor_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id          UUID NOT NULL REFERENCES societies(id),
  name                VARCHAR(150) NOT NULL,
  phone               VARCHAR(20),
  id_type             VARCHAR(30),   -- AADHAAR | DRIVING_LICENSE | PASSPORT | OTHER
  id_number_masked    VARCHAR(50),
  vehicle_no          VARCHAR(20),
  photo_document_id   UUID,  -- FK to documents(id) added at the end of migration 026
  blacklist_status    VARCHAR(20) NOT NULL DEFAULT 'NONE',  -- NONE | BLACKLISTED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- visitor_invites: id, society_id, invited_by, unit_id,
-- visitor_profile_id, expected_from, expected_until, purpose,
-- qr_token_hash, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitor_invites (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id           UUID NOT NULL REFERENCES societies(id),
  invited_by           UUID NOT NULL REFERENCES users(id),
  unit_id              UUID NOT NULL REFERENCES units(id),
  visitor_profile_id   UUID NOT NULL REFERENCES visitor_profiles(id),
  expected_from        TIMESTAMPTZ NOT NULL,
  expected_until       TIMESTAMPTZ,
  purpose              VARCHAR(255),
  qr_token_hash        VARCHAR(255),
  status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING|APPROVED|REJECTED|EXPIRED|CANCELLED
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- visitor_passes: id, invite_id (nullable - null means walk-in),
-- visitor_profile_id, gate_id, pass_no, valid_from, valid_until, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitor_passes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id            UUID REFERENCES visitor_invites(id),
  visitor_profile_id   UUID NOT NULL REFERENCES visitor_profiles(id),
  gate_id              UUID NOT NULL REFERENCES gates(id),
  pass_no              VARCHAR(50) NOT NULL,
  valid_from           TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until          TIMESTAMPTZ,
  status               VARCHAR(20) NOT NULL DEFAULT 'EXPECTED',  -- EXPECTED|ARRIVED|INSIDE|EXITED|OVERSTAY|CANCELLED
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- gate_events: id, society_id, gate_id, visitor_pass_id (nullable),
-- vehicle_id (nullable), event_type, event_at, captured_by,
-- device_event_id
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gate_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id        UUID NOT NULL REFERENCES societies(id),
  gate_id           UUID NOT NULL REFERENCES gates(id),
  visitor_pass_id   UUID REFERENCES visitor_passes(id),
  vehicle_id        UUID REFERENCES vehicles(id),
  event_type        VARCHAR(20) NOT NULL,   -- ENTRY | EXIT
  event_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_by       UUID REFERENCES users(id),
  device_event_id   UUID REFERENCES device_events(id)
);

-- ---------------------------------------------------------------------
-- overstay_alerts: id, visitor_pass_id, triggered_at, duration_minutes,
-- acknowledged_by, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS overstay_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_pass_id     UUID NOT NULL REFERENCES visitor_passes(id),
  triggered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes    INTEGER NOT NULL,
  acknowledged_by     UUID REFERENCES users(id),
  status              VARCHAR(20) NOT NULL DEFAULT 'OPEN'  -- OPEN | ACKNOWLEDGED | RESOLVED
);

CREATE INDEX IF NOT EXISTS idx_visitor_profiles_society     ON visitor_profiles(society_id);
CREATE INDEX IF NOT EXISTS idx_visitor_invites_unit         ON visitor_invites(unit_id);
CREATE INDEX IF NOT EXISTS idx_visitor_invites_visitor      ON visitor_invites(visitor_profile_id);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_invite        ON visitor_passes(invite_id);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_visitor       ON visitor_passes(visitor_profile_id);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_status        ON visitor_passes(status);
CREATE INDEX IF NOT EXISTS idx_gate_events_society_at       ON gate_events(society_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_events_pass             ON gate_events(visitor_pass_id);
CREATE INDEX IF NOT EXISTS idx_overstay_alerts_pass         ON overstay_alerts(visitor_pass_id);

-- ---------------------------------------------------------------------
-- Retroactive FK: parking_visits.visitor_id -> visitor_profiles(id)
-- parking_visits was created in migration 004, before visitor_profiles
-- existed. Added here, now that visitor_profiles exists above, and
-- safely after parking_visits already exists from migration 004.
-- ---------------------------------------------------------------------
ALTER TABLE parking_visits
  ADD CONSTRAINT parking_visits_visitor_id_fkey
  FOREIGN KEY (visitor_id) REFERENCES visitor_profiles(id);
