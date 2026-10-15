-- =====================================================================
-- Migration 015: Gates, Security Guards, Access Cards, Gate Devices
-- Matches DB Architecture doc, Section 13 "Security, Gate, Visitors,
-- Deliveries & Incidents" (Phase 9 subset only - incidents/sos_alerts
-- belong to teammate's Phase 10, deliberately excluded here)
-- Depends on: societies(id), users(id), vendors(id) [our Phase 8]
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- gates: id, society_id, name, location, gate_type, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id  UUID NOT NULL REFERENCES societies(id),
  name        VARCHAR(150) NOT NULL,
  location    VARCHAR(255),
  gate_type   VARCHAR(30) NOT NULL,   -- MAIN | SERVICE | EMERGENCY | PEDESTRIAN
  status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- security_guards: id, user_id, employee_code, agency_vendor_id, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_guards (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id),
  employee_code      VARCHAR(50),
  agency_vendor_id   UUID REFERENCES vendors(id),
  status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- access_cards: id, society_id, holder_user_id, credential_no (unique),
-- credential_type, valid_from, valid_until, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id       UUID NOT NULL REFERENCES societies(id),
  holder_user_id   UUID NOT NULL REFERENCES users(id),
  credential_no    VARCHAR(100) NOT NULL UNIQUE,
  credential_type  VARCHAR(30) NOT NULL,   -- RFID | CARD | QR | BIOMETRIC
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until      TIMESTAMPTZ,
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | REVOKED | EXPIRED
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- gate_devices: id, gate_id, device_type, serial_no (unique),
-- ip_address, status, last_seen_at
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gate_devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id       UUID NOT NULL REFERENCES gates(id) ON DELETE CASCADE,
  device_type   VARCHAR(30) NOT NULL,   -- BOOM_BARRIER | QR_SCANNER | RFID_READER | BIOMETRIC | CCTV
  serial_no     VARCHAR(100) NOT NULL UNIQUE,
  ip_address    VARCHAR(64),
  status        VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',  -- ONLINE | OFFLINE | ERROR
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- device_events: id, gate_device_id, external_event_id, event_type,
-- payload JSONB, event_at, processed_at, status
-- NOTE: the doc does not mark external_event_id as UNIQUE, so no
-- uniqueness constraint is added here even though de-duplication would
-- normally want one - flagged for the same reason we don't add
-- unmarked constraints elsewhere.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_device_id     UUID NOT NULL REFERENCES gate_devices(id) ON DELETE CASCADE,
  external_event_id  VARCHAR(150),
  event_type         VARCHAR(50) NOT NULL,
  payload            JSONB,
  event_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at       TIMESTAMPTZ,
  status             VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'  -- RECEIVED | PROCESSED | FAILED
);

CREATE INDEX IF NOT EXISTS idx_gates_society             ON gates(society_id);
CREATE INDEX IF NOT EXISTS idx_security_guards_user       ON security_guards(user_id);
CREATE INDEX IF NOT EXISTS idx_security_guards_vendor     ON security_guards(agency_vendor_id);
CREATE INDEX IF NOT EXISTS idx_access_cards_holder        ON access_cards(holder_user_id);
CREATE INDEX IF NOT EXISTS idx_access_cards_society       ON access_cards(society_id);
CREATE INDEX IF NOT EXISTS idx_gate_devices_gate          ON gate_devices(gate_id);
CREATE INDEX IF NOT EXISTS idx_device_events_device       ON device_events(gate_device_id, event_at DESC);
