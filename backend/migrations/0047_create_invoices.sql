-- PostgreSQL 13+. Table: invoices

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_invoices_status" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- invoices
CREATE TABLE "invoices" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "member_id" UUID, "billing_id" UUID, "invoice_number" VARCHAR(100) NOT NULL, "billing_period" VARCHAR(50) NOT NULL, "invoice_date" DATE NOT NULL, "due_date" DATE NOT NULL, "previous_balance" DECIMAL(15,2) NOT NULL DEFAULT 0, "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0, "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "penalty_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "outstanding_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "status" "public"."enum_invoices_status" NOT NULL DEFAULT 'DRAFT', "idempotency_key" VARCHAR(255) NOT NULL, "journal_id" UUID, "document_path" TEXT, "description" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "invoices_society_id_invoice_number" ON "invoices" ("society_id", "invoice_number");

CREATE UNIQUE INDEX "invoices_society_id_idempotency_key" ON "invoices" ("society_id", "idempotency_key");

CREATE INDEX "invoices_society_id_unit_id" ON "invoices" ("society_id", "unit_id");

CREATE INDEX "invoices_billing_id" ON "invoices" ("billing_id");

CREATE INDEX "invoices_status" ON "invoices" ("status");

CREATE INDEX "invoices_due_date" ON "invoices" ("due_date");

