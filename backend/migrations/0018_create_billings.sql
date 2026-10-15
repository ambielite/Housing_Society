-- PostgreSQL 13+. Table: billings

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_billings_billing_model" AS ENUM ('FLAT_RATE', 'AREA_BASED', 'HYBRID');

CREATE TYPE "public"."enum_billings_status" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- billings
CREATE TABLE "billings" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "member_id" UUID, "ledger_account_id" UUID NOT NULL, "billing_config_id" UUID, "bill_number" VARCHAR(100) NOT NULL, "billing_period" VARCHAR(50) NOT NULL, "bill_date" DATE NOT NULL, "due_date" DATE NOT NULL, "description" TEXT, "billing_model" "public"."enum_billings_billing_model", "unit_area" DECIMAL(15,2), "rate_per_area" DECIMAL(15,4), "fixed_amount" DECIMAL(15,2), "previous_balance" DECIMAL(15,2) NOT NULL DEFAULT 0, "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0, "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "penalty_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "outstanding_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "status" "public"."enum_billings_status" NOT NULL DEFAULT 'DRAFT', "journal_id" UUID, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "billings_society_id_bill_number" ON "billings" ("society_id", "bill_number");

CREATE INDEX "billings_society_id_unit_id" ON "billings" ("society_id", "unit_id");

CREATE INDEX "billings_society_id_ledger_account_id" ON "billings" ("society_id", "ledger_account_id");

CREATE INDEX "billings_billing_config_id" ON "billings" ("billing_config_id");

CREATE INDEX "billings_status" ON "billings" ("status");

CREATE INDEX "billings_due_date" ON "billings" ("due_date");

