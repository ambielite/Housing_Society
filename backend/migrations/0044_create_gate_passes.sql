-- PostgreSQL 13+. Table: gate_passes

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_gate_passes_lifecycle_type" AS ENUM ('MOVE_IN', 'MOVE_OUT');

CREATE TYPE "public"."enum_gate_passes_pass_type" AS ENUM ('MOVE_IN', 'MOVE_OUT');

CREATE TYPE "public"."enum_gate_passes_status" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

-- gate_passes
CREATE TABLE "gate_passes" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "resident_id" UUID NOT NULL, "lifecycle_type" "public"."enum_gate_passes_lifecycle_type" NOT NULL, "lifecycle_id" UUID NOT NULL, "pass_type" "public"."enum_gate_passes_pass_type" NOT NULL, "pass_code" VARCHAR(100) NOT NULL UNIQUE, "valid_from" TIMESTAMP WITH TIME ZONE NOT NULL, "valid_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."enum_gate_passes_status" NOT NULL DEFAULT 'ACTIVE', "verified_by" UUID, "verified_at" TIMESTAMP WITH TIME ZONE, "used_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

