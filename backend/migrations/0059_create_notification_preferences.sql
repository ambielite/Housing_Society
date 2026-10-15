-- PostgreSQL 13+. Table: notification_preferences

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_notification_preferences_channel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

-- notification_preferences
CREATE TABLE "notification_preferences" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "user_id" UUID NOT NULL, "channel" "public"."enum_notification_preferences_channel" NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true, "allow_marketing" BOOLEAN NOT NULL DEFAULT false, "allow_operational" BOOLEAN NOT NULL DEFAULT true, "allow_emergency" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "notification_preferences_society_id_user_id_channel" ON "notification_preferences" ("society_id", "user_id", "channel");

CREATE INDEX "notification_preferences_society_id" ON "notification_preferences" ("society_id");

CREATE INDEX "notification_preferences_user_id" ON "notification_preferences" ("user_id");

CREATE INDEX "notification_preferences_channel" ON "notification_preferences" ("channel");

