-- PostgreSQL 13+. Table: staff_rosters

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_staff_rosters_roster_type" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

CREATE TYPE "public"."enum_staff_rosters_status" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- staff_rosters
CREATE TABLE "staff_rosters" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "staff_id" UUID NOT NULL, "shift_id" UUID NOT NULL, "roster_date" DATE NOT NULL, "roster_type" "public"."enum_staff_rosters_roster_type" NOT NULL DEFAULT 'DAILY', "status" "public"."enum_staff_rosters_status" NOT NULL DEFAULT 'SCHEDULED', "assigned_by" UUID, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "staff_rosters_staff_id_roster_date" ON "staff_rosters" ("staff_id", "roster_date")

CREATE INDEX "staff_rosters_society_id" ON "staff_rosters" ("society_id")

CREATE INDEX "staff_rosters_staff_id" ON "staff_rosters" ("staff_id")

CREATE INDEX "staff_rosters_shift_id" ON "staff_rosters" ("shift_id")

CREATE INDEX "staff_rosters_roster_date" ON "staff_rosters" ("roster_date")

CREATE INDEX "staff_rosters_status" ON "staff_rosters" ("status")

