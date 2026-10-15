-- PostgreSQL 13+. Table: accounting_periods

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_accounting_periods_status" AS ENUM ('OPEN', 'CLOSED', 'LOCKED');

-- accounting_periods
CREATE TABLE "accounting_periods" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "name" VARCHAR(100) NOT NULL, "start_date" DATE NOT NULL, "end_date" DATE NOT NULL, "status" "public"."enum_accounting_periods_status" NOT NULL DEFAULT 'OPEN', "locked_at" TIMESTAMP WITH TIME ZONE, "locked_by" UUID, "closed_at" TIMESTAMP WITH TIME ZONE, "closed_by" UUID, "description" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "accounting_periods_society_id" ON "accounting_periods" ("society_id");

CREATE INDEX "accounting_periods_society_id_status" ON "accounting_periods" ("society_id", "status");

CREATE UNIQUE INDEX "accounting_periods_society_id_start_date_end_date" ON "accounting_periods" ("society_id", "start_date", "end_date");

