-- =====================================================================
-- Migration 020: Amenity Bookings
-- Matches DB Architecture doc, Section 17 "Amenities & Reservations"
-- Depends on: amenity_slots(id) [019], units(id), users(id)
--
-- Placeholder (nullable, NO foreign key - table doesn't exist yet):
--   amenity_bookings.payment_id -> Phase 7 (Payments, teammate, in
--   progress) - same treatment as vendor_payments.payment_id in Phase 8.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- amenity_bookings: id, amenity_slot_id, unit_id, booked_by, booking_no
-- (unique), guests_count, amount, payment_id (placeholder), status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenity_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_slot_id   UUID NOT NULL REFERENCES amenity_slots(id),
  unit_id           UUID NOT NULL REFERENCES units(id),
  booked_by         UUID NOT NULL REFERENCES users(id),
  booking_no        VARCHAR(50) NOT NULL UNIQUE,
  guests_count      INTEGER NOT NULL DEFAULT 0,
  amount            NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_id        UUID,  -- no FK yet: Phase 7 Payments (teammate, in progress)
  status            VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT',
  -- PENDING_PAYMENT | CONFIRMED | CANCELLED | NO_SHOW | EXPIRED
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- amenity_booking_guests: id, booking_id, name, phone, id_type,
-- id_number_masked
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenity_booking_guests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         UUID NOT NULL REFERENCES amenity_bookings(id) ON DELETE CASCADE,
  name               VARCHAR(150) NOT NULL,
  phone              VARCHAR(20),
  id_type            VARCHAR(30),
  id_number_masked   VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_amenity_bookings_slot    ON amenity_bookings(amenity_slot_id);
CREATE INDEX IF NOT EXISTS idx_amenity_bookings_unit    ON amenity_bookings(unit_id);
CREATE INDEX IF NOT EXISTS idx_amenity_bookings_status  ON amenity_bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_guests_booking   ON amenity_booking_guests(booking_id);
