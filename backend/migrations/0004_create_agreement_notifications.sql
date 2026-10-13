-- PostgreSQL 13+. Table: agreement_notifications

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_agreement_notifications_notification_type" AS ENUM ('AGREEMENT_EXPIRY', 'FIRST_REMINDER', 'SECOND_REMINDER', 'FINAL_REMINDER', 'EXPIRY_ALERT', 'RENEWAL_SUBMITTED', 'RENEWAL_APPROVED', 'RENEWAL_REJECTED');

CREATE TYPE "public"."enum_agreement_notifications_channel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP', 'SMS');

CREATE TYPE "public"."enum_agreement_notifications_delivery_status" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED');

-- agreement_notifications
CREATE TABLE "agreement_notifications" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "agreement_id" UUID NOT NULL, "reminder_id" UUID, "notification_type" "public"."enum_agreement_notifications_notification_type" NOT NULL, "recipient" VARCHAR(255) NOT NULL, "recipient_name" VARCHAR(255), "channel" "public"."enum_agreement_notifications_channel" NOT NULL, "subject" VARCHAR(500), "message" TEXT NOT NULL, "scheduled_at" TIMESTAMP WITH TIME ZONE, "sent_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "read_at" TIMESTAMP WITH TIME ZONE, "delivery_status" "public"."enum_agreement_notifications_delivery_status" NOT NULL DEFAULT 'PENDING', "failure_reason" TEXT, "provider_message_id" VARCHAR(255), "metadata" JSONB, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

