-- PostgreSQL 13+. Table: accounts

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_accounts_account_type" AS ENUM ('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY', 'RECEIVABLE');

-- accounts
CREATE TABLE "accounts" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "account_code" VARCHAR(50) NOT NULL, "account_name" VARCHAR(255) NOT NULL, "account_type" "public"."enum_accounts_account_type" NOT NULL, "parent_account_id" UUID, "is_control_account" BOOLEAN DEFAULT false, "is_system_account" BOOLEAN DEFAULT false, "is_active" BOOLEAN DEFAULT true, "description" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "accounts_society_id_account_code" ON "accounts" ("society_id", "account_code")

