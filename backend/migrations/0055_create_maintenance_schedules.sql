-- PostgreSQL 13+. Table: maintenance_schedules

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_maintenance_schedules_frequency_type" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM');

CREATE TYPE "public"."enum_maintenance_schedules_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_maintenance_schedules_status" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- maintenance_schedules
CREATE TABLE "maintenance_schedules" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "asset_id" UUID NOT NULL, "amc_id" UUID, "vendor_id" UUID, "schedule_code" VARCHAR(100) NOT NULL, "maintenance_title" VARCHAR(255) NOT NULL, "maintenance_description" TEXT, "frequency_type" "public"."enum_maintenance_schedules_frequency_type" NOT NULL, "frequency_value" INTEGER, "start_date" DATE NOT NULL, "last_maintenance_date" DATE, "next_due_date" DATE NOT NULL, "estimated_cost" DECIMAL(14,2), "priority" "public"."enum_maintenance_schedules_priority" NOT NULL DEFAULT 'MEDIUM', "status" "public"."enum_maintenance_schedules_status" NOT NULL DEFAULT 'ACTIVE', "auto_create_work_order" BOOLEAN NOT NULL DEFAULT true, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "maintenance_schedules_society_id_schedule_code" ON "maintenance_schedules" ("society_id", "schedule_code");

CREATE INDEX "maintenance_schedules_society_id" ON "maintenance_schedules" ("society_id");

CREATE INDEX "maintenance_schedules_asset_id" ON "maintenance_schedules" ("asset_id");

CREATE INDEX "maintenance_schedules_amc_id" ON "maintenance_schedules" ("amc_id");

CREATE INDEX "maintenance_schedules_vendor_id" ON "maintenance_schedules" ("vendor_id");

CREATE INDEX "maintenance_schedules_next_due_date" ON "maintenance_schedules" ("next_due_date");

CREATE INDEX "maintenance_schedules_status" ON "maintenance_schedules" ("status");

