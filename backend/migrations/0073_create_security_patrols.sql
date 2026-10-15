-- PostgreSQL 13+. Table: security_patrols

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_security_patrols_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED');

-- security_patrols
CREATE TABLE "security_patrols" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "staff_id" UUID NOT NULL, "patrol_code" VARCHAR(50) NOT NULL, "patrol_name" VARCHAR(150) NOT NULL, "patrol_date" DATE NOT NULL, "planned_start_time" TIME NOT NULL, "planned_end_time" TIME NOT NULL, "status" "public"."enum_security_patrols_status" NOT NULL DEFAULT 'SCHEDULED', "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "total_checkpoints" INTEGER NOT NULL DEFAULT 0, "completed_checkpoints" INTEGER NOT NULL DEFAULT 0, "missed_checkpoints" INTEGER NOT NULL DEFAULT 0, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "security_patrols_society_id_patrol_code" ON "security_patrols" ("society_id", "patrol_code");

CREATE INDEX "security_patrols_society_id" ON "security_patrols" ("society_id");

CREATE INDEX "security_patrols_staff_id" ON "security_patrols" ("staff_id");

CREATE INDEX "security_patrols_patrol_date" ON "security_patrols" ("patrol_date");

CREATE INDEX "security_patrols_status" ON "security_patrols" ("status");

