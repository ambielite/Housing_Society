-- PostgreSQL 13+. Table: shifts

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_shifts_shift_type" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'GENERAL', 'OTHER');

CREATE TYPE "public"."enum_shifts_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- shifts
CREATE TABLE "shifts" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "shift_code" VARCHAR(50) NOT NULL, "shift_name" VARCHAR(100) NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "shift_type" "public"."enum_shifts_shift_type" NOT NULL DEFAULT 'GENERAL', "break_minutes" INTEGER NOT NULL DEFAULT 0, "grace_minutes" INTEGER NOT NULL DEFAULT 0, "is_overnight" BOOLEAN NOT NULL DEFAULT false, "status" "public"."enum_shifts_status" NOT NULL DEFAULT 'ACTIVE', "description" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "shifts_society_id_shift_code" ON "shifts" ("society_id", "shift_code");

CREATE INDEX "shifts_society_id" ON "shifts" ("society_id");

CREATE INDEX "shifts_status" ON "shifts" ("status");

