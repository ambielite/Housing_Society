-- PostgreSQL 13+. Table: agreement_reminder_configs

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_agreement_reminder_configs_reminder_type" AS ENUM ('FIRST_REMINDER', 'SECOND_REMINDER', 'FINAL_REMINDER', 'EXPIRY_ALERT');

-- agreement_reminder_configs
CREATE TABLE "agreement_reminder_configs" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "days_before_expiry" INTEGER NOT NULL, "reminder_type" "public"."enum_agreement_reminder_configs_reminder_type" NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

