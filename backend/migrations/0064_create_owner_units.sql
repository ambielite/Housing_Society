-- PostgreSQL 13+. Table: owner_units

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_owner_units_ownership_type" AS ENUM ('PRIMARY_OWNER', 'CO_OWNER');

CREATE TYPE "public"."enum_owner_units_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- owner_units
CREATE TABLE "owner_units" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "owner_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "ownership_type" "public"."enum_owner_units_ownership_type" NOT NULL DEFAULT 'CO_OWNER', "ownership_percentage" DECIMAL(5,2), "effective_from" DATE NOT NULL, "effective_to" DATE, "status" "public"."enum_owner_units_status" NOT NULL DEFAULT 'ACTIVE', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "owner_units_society_id" ON "owner_units" ("society_id")

CREATE INDEX "owner_units_owner_id" ON "owner_units" ("owner_id")

CREATE INDEX "owner_units_unit_id" ON "owner_units" ("unit_id")

CREATE INDEX "owner_units_status" ON "owner_units" ("status")

CREATE INDEX "owner_units_owner_id_unit_id" ON "owner_units" ("owner_id", "unit_id")

