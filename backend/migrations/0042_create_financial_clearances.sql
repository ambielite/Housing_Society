-- PostgreSQL 13+. Table: financial_clearances

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_financial_clearances_lifecycle_type" AS ENUM ('MOVE_OUT');

CREATE TYPE "public"."enum_financial_clearances_clearance_status" AS ENUM ('PENDING', 'CLEARED', 'HOLD');

-- financial_clearances
CREATE TABLE "financial_clearances" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "resident_id" UUID NOT NULL, "lifecycle_type" "public"."enum_financial_clearances_lifecycle_type" NOT NULL DEFAULT 'MOVE_OUT', "lifecycle_id" UUID NOT NULL, "outstanding_amount" DECIMAL(12,2) NOT NULL DEFAULT 0, "clearance_status" "public"."enum_financial_clearances_clearance_status" NOT NULL DEFAULT 'PENDING', "cleared_by" UUID, "cleared_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

