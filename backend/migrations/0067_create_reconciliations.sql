-- PostgreSQL 13+. Table: reconciliations

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_reconciliations_transaction_type" AS ENUM ('CREDIT', 'DEBIT');

CREATE TYPE "public"."enum_reconciliations_status" AS ENUM ('IMPORTED', 'MATCHED', 'RECONCILED', 'UNMATCHED', 'IGNORED');

CREATE TYPE "public"."enum_reconciliations_match_type" AS ENUM ('AUTO', 'MANUAL');

-- reconciliations
CREATE TABLE "reconciliations" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "payment_id" UUID, "transaction_reference" VARCHAR(150) NOT NULL, "transaction_date" DATE NOT NULL, "value_date" DATE, "transaction_type" "public"."enum_reconciliations_transaction_type" NOT NULL, "amount" DECIMAL(14,2) NOT NULL, "bank_name" VARCHAR(100), "bank_account_number" VARCHAR(100), "description" TEXT, "utr_number" VARCHAR(150), "status" "public"."enum_reconciliations_status" NOT NULL DEFAULT 'IMPORTED', "match_type" "public"."enum_reconciliations_match_type", "matched_at" TIMESTAMP WITH TIME ZONE, "matched_by" UUID, "reconciled_at" TIMESTAMP WITH TIME ZONE, "reconciled_by" UUID, "remarks" TEXT, "metadata" JSONB, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "reconciliations_society_id_transaction_reference" ON "reconciliations" ("society_id", "transaction_reference");

CREATE INDEX "reconciliations_payment_id" ON "reconciliations" ("payment_id");

CREATE INDEX "reconciliations_utr_number" ON "reconciliations" ("utr_number");

CREATE INDEX "reconciliations_status" ON "reconciliations" ("status");

CREATE INDEX "reconciliations_transaction_date" ON "reconciliations" ("transaction_date");

