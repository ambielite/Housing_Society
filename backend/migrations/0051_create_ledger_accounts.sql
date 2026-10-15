-- PostgreSQL 13+. Table: ledger_accounts

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_ledger_accounts_balance_type" AS ENUM ('DEBIT', 'CREDIT');

-- ledger_accounts
CREATE TABLE "ledger_accounts" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID, "member_id" UUID, "account_id" UUID NOT NULL, "ledger_code" VARCHAR(100) NOT NULL, "ledger_name" VARCHAR(255) NOT NULL, "opening_balance" DECIMAL(15,2) NOT NULL DEFAULT 0, "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0, "balance_type" "public"."enum_ledger_accounts_balance_type" NOT NULL DEFAULT 'DEBIT', "is_active" BOOLEAN NOT NULL DEFAULT true, "description" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "ledger_accounts_society_id_ledger_code" ON "ledger_accounts" ("society_id", "ledger_code");

CREATE INDEX "ledger_accounts_society_id_unit_id" ON "ledger_accounts" ("society_id", "unit_id");

CREATE INDEX "ledger_accounts_society_id_member_id" ON "ledger_accounts" ("society_id", "member_id");

CREATE INDEX "ledger_accounts_account_id" ON "ledger_accounts" ("account_id");

