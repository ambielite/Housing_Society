-- PostgreSQL 13+. Table: units

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_units_property_type" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

CREATE TYPE "public"."enum_units_status" AS ENUM ('VACANT', 'OCCUPIED', 'UNDER_MOVE_IN', 'UNDER_MOVE_OUT', 'INACTIVE');

-- units
CREATE TABLE "units" ("id" UUID  DEFAULT gen_random_uuid(), "floor_id" UUID NOT NULL, "unit_number" VARCHAR(50) NOT NULL, "bhk" VARCHAR(20), "carpet_area" DECIMAL(12,2), "built_up_area" DECIMAL(12,2), "property_type" "public"."enum_units_property_type" NOT NULL DEFAULT 'RESIDENTIAL', "status" "public"."enum_units_status" NOT NULL DEFAULT 'VACANT', "area_effective_from" DATE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "units_floor_id_unit_number" ON "units" ("floor_id", "unit_number");

