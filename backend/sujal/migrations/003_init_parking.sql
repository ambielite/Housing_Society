-- =====================================================================
-- Migration 003: Parking - areas, slots, allocations
-- Matches DB Architecture doc, Section 7 "Parking & Vehicle Management"
-- Depends on: societies(id), units(id)  [teammate's Phase 2 - see 000]
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- parking_areas: id, society_id, name, parking_type, floor/zone, status
-- ("floor/zone" from the doc is a single free-text location column)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_areas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id    UUID NOT NULL REFERENCES societies(id),
  name          VARCHAR(150) NOT NULL,
  parking_type  VARCHAR(30) NOT NULL,   -- COVERED | OPEN | MECHANICAL | STACK
  zone          VARCHAR(100),           -- floor/zone descriptor
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- parking_slots: id, parking_area_id, slot_code, slot_type, vehicle_type, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_area_id  UUID NOT NULL REFERENCES parking_areas(id) ON DELETE CASCADE,
  slot_code        VARCHAR(50) NOT NULL,
  slot_type        VARCHAR(30) NOT NULL,   -- COVERED | OPEN | MECHANICAL | STACK | VISITOR
  vehicle_type     VARCHAR(30) NOT NULL,   -- TWO_WHEELER | FOUR_WHEELER | EV | OTHER
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parking_area_id, slot_code)
);

-- ---------------------------------------------------------------------
-- parking_allocations: id, slot_id, unit_id, user_id, allocation_type,
-- start_date, end_date, fee, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id          UUID NOT NULL REFERENCES parking_slots(id),
  unit_id          UUID NOT NULL REFERENCES units(id),
  user_id          UUID REFERENCES users(id),
  allocation_type  VARCHAR(30) NOT NULL,   -- OWNER | TENANT | VISITOR | TEMPORARY_RENTAL
  start_date       DATE NOT NULL,
  end_date         DATE,
  fee              NUMERIC(10, 2),
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | EXPIRED | CANCELLED
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Business rule (spec Section 10): "One active allocation per restricted
-- bay at a time" - enforced here at the DB level, not just in the service.
CREATE UNIQUE INDEX IF NOT EXISTS idx_parking_allocations_one_active_per_slot
  ON parking_allocations (slot_id) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_parking_areas_society     ON parking_areas(society_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_area        ON parking_slots(parking_area_id);
CREATE INDEX IF NOT EXISTS idx_parking_allocations_slot  ON parking_allocations(slot_id);
CREATE INDEX IF NOT EXISTS idx_parking_allocations_unit  ON parking_allocations(unit_id);
