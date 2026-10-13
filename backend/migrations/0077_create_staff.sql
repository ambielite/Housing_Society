-- PostgreSQL 13+. Table: staff

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_staff_staff_type" AS ENUM ('SECURITY_GUARD', 'SECURITY_SUPERVISOR', 'HOUSEKEEPING', 'MAINTENANCE', 'ELECTRICIAN', 'PLUMBER', 'GARDENER', 'OTHER');

CREATE TYPE "public"."enum_staff_status" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');

-- staff
CREATE TABLE "staff" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "employee_code" VARCHAR(50) NOT NULL, "first_name" VARCHAR(100) NOT NULL, "last_name" VARCHAR(100), "mobile_number" VARCHAR(20) NOT NULL, "email" VARCHAR(150), "date_of_birth" DATE, "joining_date" DATE NOT NULL, "staff_type" "public"."enum_staff_staff_type" NOT NULL, "designation" VARCHAR(100), "department" VARCHAR(100), "status" "public"."enum_staff_status" NOT NULL DEFAULT 'ACTIVE', "emergency_contact_name" VARCHAR(150), "emergency_contact_number" VARCHAR(20), "address" TEXT, "photo_path" VARCHAR(500), "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "staff_society_id_employee_code" ON "staff" ("society_id", "employee_code")

CREATE INDEX "staff_society_id_status" ON "staff" ("society_id", "status")

CREATE INDEX "staff_society_id_staff_type" ON "staff" ("society_id", "staff_type")

