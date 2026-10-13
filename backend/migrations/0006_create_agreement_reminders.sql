-- PostgreSQL 13+. Table: agreement_reminders

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_agreement_reminders_reminder_type" AS ENUM ('FIRST_REMINDER', 'SECOND_REMINDER', 'FINAL_REMINDER', 'EXPIRY_ALERT');

CREATE TYPE "public"."enum_agreement_reminders_status" AS ENUM ('PENDING', 'PROCESSED', 'SKIPPED', 'FAILED');

-- agreement_reminders
CREATE TABLE "agreement_reminders" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "agreement_id" UUID NOT NULL, "reminder_type" "public"."enum_agreement_reminders_reminder_type" NOT NULL, "days_before_expiry" INTEGER NOT NULL, "agreement_expiry_date" DATE NOT NULL, "reminder_date" DATE NOT NULL, "status" "public"."enum_agreement_reminders_status" NOT NULL DEFAULT 'PENDING', "processed_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

