-- =====================================================================
-- Migration 019: Amenities setup - master, slots, pricing, blockouts
-- Matches DB Architecture doc, Section 17 "Amenities & Reservations"
-- Depends on: societies(id), users(id)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- amenities: id, society_id, name, amenity_type, capacity, location,
-- booking_required, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id         UUID NOT NULL REFERENCES societies(id),
  name               VARCHAR(150) NOT NULL,
  amenity_type       VARCHAR(50) NOT NULL,   -- CLUBHOUSE | POOL | GYM | PARTY_HALL | TENNIS_COURT | OTHER
  capacity           INTEGER,
  location           VARCHAR(255),
  booking_required   BOOLEAN NOT NULL DEFAULT true,
  status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | INACTIVE
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- amenity_slots: id, amenity_id, slot_date, start_time, end_time,
-- capacity, price, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenity_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id   UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  slot_date    DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  capacity     INTEGER NOT NULL,
  price        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status       VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE | FULL | BLOCKED | CANCELLED
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- amenity_pricing_rules: id, amenity_id, member_type, day_type, price,
-- effective_from, effective_to
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenity_pricing_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id       UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  member_type      VARCHAR(20) NOT NULL,   -- OWNER | TENANT
  day_type         VARCHAR(20) NOT NULL,   -- PEAK | NON_PEAK
  price            NUMERIC(10, 2) NOT NULL,
  effective_from   DATE NOT NULL,
  effective_to     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- amenity_blockouts: id, amenity_id, start_at, end_at, reason, created_by
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenity_blockouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id   UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  start_at     TIMESTAMPTZ NOT NULL,
  end_at       TIMESTAMPTZ NOT NULL,
  reason       VARCHAR(255),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amenities_society           ON amenities(society_id);
CREATE INDEX IF NOT EXISTS idx_amenity_slots_amenity_date   ON amenity_slots(amenity_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_amenity_pricing_amenity      ON amenity_pricing_rules(amenity_id);
CREATE INDEX IF NOT EXISTS idx_amenity_blockouts_amenity    ON amenity_blockouts(amenity_id, start_at, end_at);
