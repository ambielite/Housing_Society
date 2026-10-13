-- PostgreSQL 13+. Table: move_outs

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_move_outs_status" AS ENUM ('REQUESTED', 'CHECKLIST_PENDING', 'DUES_PENDING', 'FINANCIAL_CLEARANCE_PENDING', 'UNDER_VERIFICATION', 'APPROVED', 'REJECTED', 'MOVE_OUT_PASS_ISSUED', 'ACCESS_REVOKED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "public"."enum_move_outs_financial_clearance_status" AS ENUM ('PENDING', 'CLEARED', 'HOLD');

-- move_outs
CREATE TABLE "move_outs" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "resident_id" UUID NOT NULL, "requested_move_out_date" DATE NOT NULL, "effective_move_out_date" DATE, "gate_pass_code" VARCHAR(6), "configured_charges" DECIMAL(12,2) NOT NULL DEFAULT 0, "revert_billing_to_owner" BOOLEAN NOT NULL DEFAULT true, "charges_paid" DECIMAL(12,2) NOT NULL DEFAULT 0, "signed_off_by" UUID, "signed_off_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancellation_reason" TEXT, "actual_move_out_date" DATE, "status" "public"."enum_move_outs_status" NOT NULL DEFAULT 'REQUESTED', "checklist_completed" BOOLEAN DEFAULT false, "checklist_tasks" JSONB NOT NULL DEFAULT '[]', "outstanding_amount" DECIMAL(12,2) DEFAULT 0, "financial_clearance_status" "public"."enum_move_outs_financial_clearance_status" DEFAULT 'PENDING', "remarks" TEXT, "approved_by" UUID, "approved_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

