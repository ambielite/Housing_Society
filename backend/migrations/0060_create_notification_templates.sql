-- PostgreSQL 13+. Table: notification_templates

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_notification_templates_channel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

CREATE TYPE "public"."enum_notification_templates_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- notification_templates
CREATE TABLE "notification_templates" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID, "template_code" VARCHAR(100) NOT NULL, "template_name" VARCHAR(255) NOT NULL, "channel" "public"."enum_notification_templates_channel" NOT NULL, "subject" VARCHAR(255), "title" VARCHAR(255), "message_template" TEXT NOT NULL, "variables" JSONB, "status" "public"."enum_notification_templates_status" NOT NULL DEFAULT 'ACTIVE', "description" TEXT, "created_by" UUID, "updated_by" UUID, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "notification_templates_society_id_template_code_channel" ON "notification_templates" ("society_id", "template_code", "channel")

CREATE INDEX "notification_templates_society_id" ON "notification_templates" ("society_id")

CREATE INDEX "notification_templates_template_code" ON "notification_templates" ("template_code")

CREATE INDEX "notification_templates_channel" ON "notification_templates" ("channel")

CREATE INDEX "notification_templates_status" ON "notification_templates" ("status")

