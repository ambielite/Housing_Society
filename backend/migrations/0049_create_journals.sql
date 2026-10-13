-- PostgreSQL 13+. Table: journals

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_journals_status" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- journals
CREATE TABLE "journals" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "accounting_period_id" UUID NOT NULL, "journal_number" VARCHAR(100) NOT NULL, "transaction_date" DATE NOT NULL, "reference_type" VARCHAR(100), "reference_id" UUID, "description" TEXT, "status" "public"."enum_journals_status" DEFAULT 'DRAFT', "total_debit" DECIMAL(15,2) DEFAULT 0, "total_credit" DECIMAL(15,2) DEFAULT 0, "posted_at" TIMESTAMP WITH TIME ZONE, "posted_by" UUID, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

