-- PostgreSQL 13+. Table: access_assignments

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_access_assignments_lifecycle_type" AS ENUM ('MOVE_IN', 'MOVE_OUT');

CREATE TYPE "public"."enum_access_assignments_access_type" AS ENUM ('RESIDENT', 'OWNER', 'TENANT', 'VEHICLE', 'GATE', 'COMMON_AREA');

CREATE TYPE "public"."enum_access_assignments_access_status" AS ENUM ('ACTIVE', 'REVOKED', 'SUSPENDED');

-- access_assignments
CREATE TABLE "access_assignments" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "resident_id" UUID NOT NULL, "lifecycle_type" "public"."enum_access_assignments_lifecycle_type" NOT NULL, "lifecycle_id" UUID NOT NULL, "access_type" "public"."enum_access_assignments_access_type" NOT NULL, "access_status" "public"."enum_access_assignments_access_status" NOT NULL DEFAULT 'ACTIVE', "activated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "activated_by" UUID, "revoked_by" UUID, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
--
