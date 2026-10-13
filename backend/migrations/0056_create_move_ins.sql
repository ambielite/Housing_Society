-- PostgreSQL 13+. Table: move_ins

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_move_ins_occupancy_type" AS ENUM ('OWNER', 'TENANT');

CREATE TYPE "public"."enum_move_ins_status" AS ENUM ('PENDING_DOCUMENTS', 'DOCUMENTS_SUBMITTED', 'UNDER_VERIFICATION', 'INFORMATION_REQUIRED', 'APPROVED', 'REJECTED', 'GATE_PASS_ISSUED', 'LEDGER_CREATED', 'ACCESS_ACTIVATED', 'COMPLETED', 'CANCELLED');

-- move_ins
CREATE TABLE "move_ins" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "resident_id" UUID NOT NULL, "occupancy_type" "public"."enum_move_ins_occupancy_type" NOT NULL, "requested_move_in_date" DATE NOT NULL, "agreement_id" UUID, "lease_document" TEXT, "registry_document" TEXT, "police_verification_document" TEXT, "gate_pass_code" VARCHAR(6), "information_request" TEXT, "actual_move_in_date" DATE, "status" "public"."enum_move_ins_status" NOT NULL DEFAULT 'PENDING_DOCUMENTS', "remarks" TEXT, "approved_by" UUID, "approved_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

