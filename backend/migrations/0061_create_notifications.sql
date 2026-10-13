-- PostgreSQL 13+. Table: notifications

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_notifications_channel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

CREATE TYPE "public"."enum_notifications_notification_type" AS ENUM ('OPERATIONAL', 'MARKETING', 'EMERGENCY');

CREATE TYPE "public"."enum_notifications_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_notifications_status" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');

-- notifications
CREATE TABLE "notifications" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "user_id" UUID NOT NULL, "template_id" UUID, "channel" "public"."enum_notifications_channel" NOT NULL, "notification_type" "public"."enum_notifications_notification_type" NOT NULL DEFAULT 'OPERATIONAL', "title" VARCHAR(255), "subject" VARCHAR(255), "message" TEXT NOT NULL, "data" JSONB, "reference_type" VARCHAR(100), "reference_id" UUID, "priority" "public"."enum_notifications_priority" NOT NULL DEFAULT 'MEDIUM', "status" "public"."enum_notifications_status" NOT NULL DEFAULT 'PENDING', "is_read" BOOLEAN NOT NULL DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, "scheduled_at" TIMESTAMP WITH TIME ZONE, "sent_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "failed_at" TIMESTAMP WITH TIME ZONE, "retry_count" INTEGER NOT NULL DEFAULT 0, "error_message" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "notifications_society_id" ON "notifications" ("society_id")

CREATE INDEX "notifications_user_id" ON "notifications" ("user_id")

CREATE INDEX "notifications_template_id" ON "notifications" ("template_id")

CREATE INDEX "notifications_channel" ON "notifications" ("channel")

CREATE INDEX "notifications_notification_type" ON "notifications" ("notification_type")

CREATE INDEX "notifications_status" ON "notifications" ("status")

CREATE INDEX "notifications_is_read" ON "notifications" ("is_read")

CREATE INDEX "notifications_scheduled_at" ON "notifications" ("scheduled_at")

CREATE INDEX "notifications_reference_type_reference_id" ON "notifications" ("reference_type", "reference_id")

