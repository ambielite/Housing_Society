-- =====================================================================
-- Migration 030: Utility Types & Meters
-- Matches DB Architecture doc, Section 12 "Utilities & Metering"
-- Depends on: societies(id), units(id) [teammate's Phase 2]
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- utility_types: id, society_id, code, name, unit_of_measure, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utility_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id        UUID NOT NULL REFERENCES societies(id),
  code              VARCHAR(50) NOT NULL,
  name              VARCHAR(150) NOT NULL,
  unit_of_measure   VARCHAR(20) NOT NULL,   -- KWH | LITERS | KG | UNITS
  status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- meters: id, society_id, unit_id (nullable - common-area meters have
-- no unit), meter_no, utility_type_id, installation_date, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id          UUID NOT NULL REFERENCES societies(id),
  unit_id             UUID REFERENCES units(id),
  meter_no            VARCHAR(50) NOT NULL,
  utility_type_id     UUID NOT NULL REFERENCES utility_types(id),
  installation_date   DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | REPLACED | DECOMMISSIONED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_utility_types_society  ON utility_types(society_id);
CREATE INDEX IF NOT EXISTS idx_meters_society          ON meters(society_id);
CREATE INDEX IF NOT EXISTS idx_meters_unit             ON meters(unit_id);
CREATE INDEX IF NOT EXISTS idx_meters_utility_type     ON meters(utility_type_id);
CREATE INDEX IF NOT EXISTS idx_meters_status           ON meters(status);
