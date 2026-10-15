-- =====================================================================
-- Migration 017: Deliveries & Parcels
-- Matches DB Architecture doc, Section 13
-- Depends on: societies(id), units(id), visitor_profiles(id) [016]
--
-- NOTE: the functional spec (Section 18) mentions "package photo" and
-- "pickup OTP" for parcels, but the parcels table in Section 13 has NO
-- photo or OTP columns. Built exactly as the table is documented -
-- those two fields are deliberately NOT added. See conversation notes.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- deliveries: id, society_id, unit_id, visitor_profile_id (nullable),
-- delivery_type, courier_name, tracking_no, received_at,
-- handed_over_at, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id           UUID NOT NULL REFERENCES societies(id),
  unit_id              UUID NOT NULL REFERENCES units(id),
  visitor_profile_id   UUID REFERENCES visitor_profiles(id),
  delivery_type        VARCHAR(30) NOT NULL,   -- COURIER | FOOD | E_COMMERCE | GROCERY | OTHER
  courier_name         VARCHAR(100),
  tracking_no          VARCHAR(100),
  received_at          TIMESTAMPTZ,
  handed_over_at       TIMESTAMPTZ,
  status               VARCHAR(20) NOT NULL DEFAULT 'EXPECTED',
  -- EXPECTED|ARRIVED|INSIDE|LEFT_AT_GATE|PICKED_UP|EXITED|OVERSTAY|CANCELLED
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- parcels: id, delivery_id, parcel_code, storage_location, received_by,
-- collected_by, collected_at, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parcels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id       UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  parcel_code       VARCHAR(50),
  storage_location  VARCHAR(100),
  received_by       UUID REFERENCES users(id),
  collected_by      UUID REFERENCES users(id),
  collected_at      TIMESTAMPTZ,
  status            VARCHAR(20) NOT NULL DEFAULT 'STORED'  -- STORED | COLLECTED | DAMAGED | LOST
);

CREATE INDEX IF NOT EXISTS idx_deliveries_society     ON deliveries(society_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_unit         ON deliveries(unit_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status       ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_parcels_delivery        ON parcels(delivery_id);
