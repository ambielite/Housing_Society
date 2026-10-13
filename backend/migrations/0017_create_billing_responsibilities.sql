-- PostgreSQL 13+. Table: billing_responsibilities

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_billing_responsibilities_responsibility_type" AS ENUM ('OWNER', 'TENANT');

-- billing_responsibilities
CREATE TABLE "billing_responsibilities" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "resident_id" UUID NOT NULL, "responsibility_type" "public"."enum_billing_responsibilities_responsibility_type" NOT NULL, "start_date" DATE NOT NULL, "end_date" DATE, "is_current" BOOLEAN NOT NULL DEFAULT true, "billing_account_id" UUID, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

