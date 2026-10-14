


-- =====================================================================
-- Migration 000: Reference copy of teammate's Phase 2 schema
-- (societies, towers, floors, units)
--
-- THIS IS NOT OUR CODE. It is a direct copy of what already exists in
-- the shared/teammate database, obtained via:
--   pg_dump --schema-only -t societies -t towers -t floors -t units ...
-- It exists ONLY so that a fresh local database has real `societies`
-- and `units` tables for our Phase 4 foreign keys to attach to during
-- local development/testing.
--
-- DO NOT edit business logic here. When Phase 2 is merged into the
-- shared database this file becomes redundant (CREATE TABLE IF NOT
-- EXISTS makes it a safe no-op if the real tables already exist).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE enum_floors_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_towers_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_units_property_type AS ENUM ('RESIDENTIAL', 'COMMERCIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_units_status AS ENUM ('VACANT', 'OCCUPIED', 'UNDER_MOVE_IN', 'UNDER_MOVE_OUT', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS societies (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(255) NOT NULL,
  rera_number        VARCHAR(100),
  pan                VARCHAR(20),
  gstin              VARCHAR(20),
  address            TEXT NOT NULL,
  structural_area    NUMERIC,
  currency           VARCHAR(10) NOT NULL DEFAULT 'INR',
  timezone           VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  tax_configuration  JSONB,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS towers (
  id           UUID PRIMARY KEY,
  society_id   UUID NOT NULL REFERENCES societies(id),
  name         VARCHAR(255) NOT NULL,
  floor_count  INTEGER NOT NULL,
  status       enum_towers_status NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS towers_society_id_name ON towers (society_id, name);

CREATE TABLE IF NOT EXISTS floors (
  id            UUID PRIMARY KEY,
  tower_id      UUID NOT NULL REFERENCES towers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  floor_number  INTEGER NOT NULL,
  name          VARCHAR(100),
  status        enum_floors_status NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS floors_tower_id_floor_number ON floors (tower_id, floor_number);

CREATE TABLE IF NOT EXISTS units (
  id                   UUID PRIMARY KEY,
  floor_id             UUID NOT NULL REFERENCES floors(id) ON UPDATE CASCADE ON DELETE CASCADE,
  society_id           UUID REFERENCES societies(id),
  unit_number          VARCHAR(50) NOT NULL,
  bhk                  VARCHAR(20),
  carpet_area          NUMERIC(12, 2),
  built_up_area        NUMERIC(12, 2),
  property_type        enum_units_property_type NOT NULL DEFAULT 'RESIDENTIAL',
  status               enum_units_status NOT NULL DEFAULT 'VACANT',
  area_effective_from  DATE,
  created_at           TIMESTAMPTZ NOT NULL,
  updated_at           TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS units_floor_id_unit_number ON units (floor_id, unit_number);
CREATE INDEX IF NOT EXISTS units_society_id ON units (society_id);


-- what does index means and why it is used i the file tell me in short simple

-- An index is like a book's index page — instead of Postgres scanning every single row to find what you're looking for, it jumps straight to the matching rows using a pre-built lookup structure. Same reason books have an index instead of making you read every page to find "chapter 5."

-- Why it's used here specifically: almost every query we'll run in Phase 6 filters by society — "get all vehicles for this society," "get all invoices for this unit." Without an index on society_id, Postgres would scan the entire units table every time to find matching rows. With the index, it finds them almost instantly, even with thousands of rows.

-- Trade-off: indexes speed up reads but slightly slow down writes (insert/update) since the index also has to update. Worth it here since we'll read/filter by society_id constantly, but rarely insert new units.


-- What I changed in that file — two additions to the units table definition:

-- Added the column: society_id UUID REFERENCES societies(id)
-- Added the index: CREATE INDEX IF NOT EXISTS units_society_id ON units (society_id)