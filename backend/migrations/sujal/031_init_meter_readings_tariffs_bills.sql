-- =====================================================================
-- Migration 031: Meter Readings, Utility Tariffs, Utility Bills
-- Matches DB Architecture doc, Section 12 "Utilities & Metering"
-- Depends on: meters(id), utility_types(id) [030], users(id),
--             documents(id) [our Phase 16, Document Vault]
--
-- Placeholders (nullable, NO foreign key - tables belong to your
-- teammate's Billing phase, schema unknown/unbuilt by us):
--   utility_bills.billing_cycle_id -> billing_cycles(id)
--   utility_bills.invoice_line_id  -> invoice_lines(id)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- meter_readings: id, meter_id, reading_date, reading_value, source,
-- captured_by, image_document_id, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meter_readings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id            UUID NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  reading_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_value       NUMERIC(14, 2) NOT NULL,
  source              VARCHAR(20) NOT NULL DEFAULT 'MANUAL',  -- MANUAL | BULK | DEVICE
  captured_by         UUID REFERENCES users(id),
  image_document_id   UUID REFERENCES documents(id),  -- real FK: Document Vault already built
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- PENDING | SUBMITTED | VALIDATED | ESTIMATED | REJECTED | BILLED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- utility_tariffs: id, society_id, utility_type_id, slab_config JSONB,
-- effective_from, effective_to
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utility_tariffs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id       UUID NOT NULL REFERENCES societies(id),
  utility_type_id  UUID NOT NULL REFERENCES utility_types(id),
  slab_config      JSONB NOT NULL,
  effective_from   DATE NOT NULL,
  effective_to     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- utility_bills: id, meter_id, billing_cycle_id (placeholder),
-- previous_reading, current_reading, consumption, amount,
-- invoice_line_id (placeholder), status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utility_bills (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id           UUID NOT NULL REFERENCES meters(id),
  billing_cycle_id   UUID,  -- no FK yet: teammate's Billing phase, schema unbuilt/unknown here
  previous_reading   NUMERIC(14, 2),
  current_reading    NUMERIC(14, 2),
  consumption        NUMERIC(14, 2),
  amount             NUMERIC(12, 2),
  invoice_line_id    UUID,  -- no FK yet: teammate's Billing phase, schema unbuilt/unknown here
  status             VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | CALCULATED | INVOICED | ADJUSTED
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meter_readings_meter    ON meter_readings(meter_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_meter_readings_status   ON meter_readings(status);
CREATE INDEX IF NOT EXISTS idx_utility_tariffs_type    ON utility_tariffs(utility_type_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_meter     ON utility_bills(meter_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_cycle     ON utility_bills(billing_cycle_id);
