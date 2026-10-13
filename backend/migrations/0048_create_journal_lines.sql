-- PostgreSQL 13+. Table: journal_lines

-- Includes this table's enum types, columns and indexes.

-- journal_lines
CREATE TABLE "journal_lines" ("id" UUID  DEFAULT gen_random_uuid(), "journal_id" UUID NOT NULL, "account_id" UUID NOT NULL, "line_number" INTEGER NOT NULL, "description" TEXT, "debit_amount" DECIMAL(15,2) DEFAULT 0, "credit_amount" DECIMAL(15,2) DEFAULT 0, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

