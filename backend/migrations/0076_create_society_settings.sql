-- PostgreSQL 13+. Table: society_settings

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_society_settings_billing_cycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- society_settings
CREATE TABLE "society_settings" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL UNIQUE, "billing_cycle" "public"."enum_society_settings_billing_cycle" NOT NULL DEFAULT 'MONTHLY', "due_date" INTEGER NOT NULL DEFAULT 10, "penalty_rules" JSONB NOT NULL DEFAULT '{}', "approval_hierarchy" JSONB NOT NULL DEFAULT '[]', "visitor_categories" JSONB NOT NULL DEFAULT '[]', "amenity_rules" JSONB NOT NULL DEFAULT '{}', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

