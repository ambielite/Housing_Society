-- =====================================================================
-- Migration 004: Vehicles, access credentials, parking visits
-- Matches DB Architecture doc, Section 7 "Parking & Vehicle Management"
--
-- vehicle_documents: added now that Document Vault exists (documents
-- table). document_id is created here as plain UUID (NOT inline
-- REFERENCES) because this migration runs BEFORE migration 026, which
-- is where the documents table is actually created - an inline FK here
-- would break a fresh install. The real FK constraint for
-- vehicle_documents.document_id is added via ALTER TABLE at the end of
-- migration 026, once documents() exists. vehicle_id, by contrast, IS
-- a real inline FK here since vehicles already exists earlier in this
-- same file.
--
-- parking_visits.visitor_id: now that Phase 9's visitor_profiles table
-- exists, this should reference it - but visitor_profiles is created
-- in migration 016, which runs AFTER this one. Same fresh-install
-- ordering problem, same fix: the real FK constraint is added via
-- ALTER TABLE at the end of migration 016, once visitor_profiles()
-- exists. The column itself stays a plain UUID here.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- vehicles: id, society_id, owner_user_id, unit_id, registration_no
-- (unique per society), vehicle_type, make, model, color, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id       UUID NOT NULL REFERENCES societies(id),
  owner_user_id    UUID REFERENCES users(id),
  unit_id          UUID REFERENCES units(id),
  registration_no  VARCHAR(20) NOT NULL,
  vehicle_type     VARCHAR(30) NOT NULL,   -- TWO_WHEELER | FOUR_WHEELER | OTHER
  make             VARCHAR(100),
  model            VARCHAR(100),
  color            VARCHAR(50),
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | INACTIVE | BLOCKED | SOLD_TRANSFERRED
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (society_id, registration_no)
);

-- ---------------------------------------------------------------------
-- vehicle_access_credentials: id, vehicle_id, credential_type,
-- credential_value (unique), issued_at, expires_at, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_access_credentials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id        UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  credential_type   VARCHAR(30) NOT NULL,   -- RFID | STICKER | QR
  credential_value  VARCHAR(100) NOT NULL UNIQUE,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,
  status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'  -- ACTIVE | REVOKED | EXPIRED
);

-- ---------------------------------------------------------------------
-- vehicle_documents: id, vehicle_id, document_id, document_type,
-- expiry_date, verification_status
-- (see migration-level note above re: why document_id has no inline FK)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id           UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_id          UUID,  -- FK to documents(id) added at the end of migration 026
  document_type        VARCHAR(50) NOT NULL,
  expiry_date          DATE,
  verification_status  VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING|VERIFIED|REJECTED
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- parking_visits: id, society_id, vehicle_id (nullable), visitor_id
-- (see migration-level note above re: why visitor_id has no inline FK),
-- slot_id, entry_at, exit_at, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_visits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id   UUID NOT NULL REFERENCES societies(id),
  vehicle_id   UUID REFERENCES vehicles(id),
  visitor_id   UUID,   -- FK to visitor_profiles(id) added at the end of migration 016
  slot_id      UUID NOT NULL REFERENCES parking_slots(id),
  entry_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  exit_at      TIMESTAMPTZ,
  status       VARCHAR(20) NOT NULL DEFAULT 'INSIDE'  -- INSIDE | EXITED | OVERSTAY | CANCELLED
);

CREATE INDEX IF NOT EXISTS idx_vehicles_society        ON vehicles(society_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_unit           ON vehicles(unit_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_credentials_veh ON vehicle_access_credentials(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_veh   ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parking_visits_slot     ON parking_visits(slot_id);
CREATE INDEX IF NOT EXISTS idx_parking_visits_vehicle  ON parking_visits(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parking_visits_status   ON parking_visits(society_id, status);
