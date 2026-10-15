-- PostgreSQL 13+. Table: staff_attendance

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_staff_attendance_status" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE');

-- staff_attendance
CREATE TABLE "staff_attendance" ("id" UUID  DEFAULT gen_random_uuid(), "staff_id" UUID NOT NULL, "attendance_date" DATE NOT NULL, "check_in_time" TIMESTAMP WITH TIME ZONE, "check_out_time" TIMESTAMP WITH TIME ZONE, "status" "public"."enum_staff_attendance_status" NOT NULL DEFAULT 'PRESENT', "working_minutes" INTEGER, "overtime_minutes" INTEGER DEFAULT 0, "remarks" TEXT, "marked_by" UUID, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "staff_attendance_staff_id_attendance_date" ON "staff_attendance" ("staff_id", "attendance_date");

CREATE INDEX "staff_attendance_staff_id" ON "staff_attendance" ("staff_id");

CREATE INDEX "staff_attendance_attendance_date" ON "staff_attendance" ("attendance_date");

CREATE INDEX "staff_attendance_status" ON "staff_attendance" ("status");

