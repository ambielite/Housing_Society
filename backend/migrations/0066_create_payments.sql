-- PostgreSQL 13+. Table: payments

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_payments_payment_method" AS ENUM ('ONLINE', 'CHEQUE', 'NEFT', 'RTGS', 'BANK_TRANSFER', 'CASH');

CREATE TYPE "public"."enum_payments_payment_channel" AS ENUM ('GATEWAY', 'OFFLINE');

CREATE TYPE "public"."enum_payments_status" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'VERIFICATION_PENDING', 'VERIFIED');

-- payments
CREATE TABLE "payments" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "invoice_id" UUID, "unit_id" UUID, "member_id" UUID, "ledger_account_id" UUID, "payment_reference" VARCHAR(100) NOT NULL, "payment_method" "public"."enum_payments_payment_method" NOT NULL, "payment_channel" "public"."enum_payments_payment_channel" NOT NULL DEFAULT 'OFFLINE', "amount" DECIMAL(14,2) NOT NULL, "payment_date" DATE NOT NULL, "status" "public"."enum_payments_status" NOT NULL DEFAULT 'INITIATED', "gateway_name" VARCHAR(50), "gateway_order_id" VARCHAR(150), "gateway_transaction_id" VARCHAR(150), "gateway_signature" TEXT, "idempotency_key" VARCHAR(150) NOT NULL, "receipt_number" VARCHAR(100), "journal_id" UUID, "verification_remarks" TEXT, "verified_by" UUID, "verified_at" TIMESTAMP WITH TIME ZONE, "metadata" JSONB, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "payments_society_id_idempotency_key" ON "payments" ("society_id", "idempotency_key");

CREATE UNIQUE INDEX "payments_society_id_payment_reference" ON "payments" ("society_id", "payment_reference");

CREATE UNIQUE INDEX "payments_receipt_number" ON "payments" ("receipt_number");

CREATE INDEX "payments_invoice_id" ON "payments" ("invoice_id");

CREATE INDEX "payments_status" ON "payments" ("status");

CREATE INDEX "payments_payment_date" ON "payments" ("payment_date");

