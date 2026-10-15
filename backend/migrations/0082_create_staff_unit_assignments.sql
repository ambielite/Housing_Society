-- PostgreSQL 13+. Table: staff_unit_assignments

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_staff_unit_assignments_assignment_type" AS ENUM ('HOUSEKEEPING', 'MAINTENANCE', 'SECURITY', 'SUPPORT', 'OTHER');

CREATE TYPE "public"."enum_staff_unit_assignments_status" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED');

-- staff_unit_assignments
CREATE TABLE "staff_unit_assignments" ("id" UUID  DEFAULT gen_random_uuid(), "staff_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "assignment_type" "public"."enum_staff_unit_assignments_assignment_type" NOT NULL, "start_date" DATE NOT NULL, "end_date" DATE, "status" "public"."enum_staff_unit_assignments_status" NOT NULL DEFAULT 'ACTIVE', "responsibility" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "staff_unit_assignments_staff_id" ON "staff_unit_assignments" ("staff_id");

CREATE INDEX "staff_unit_assignments_unit_id" ON "staff_unit_assignments" ("unit_id");

CREATE INDEX "staff_unit_assignments_status" ON "staff_unit_assignments" ("status");

CREATE INDEX "staff_unit_assignments_assignment_type" ON "staff_unit_assignments" ("assignment_type");

CREATE UNIQUE INDEX "staff_unit_assignments_staff_id_unit_id_start_date" ON "staff_unit_assignments" ("staff_id", "unit_id", "start_date");

