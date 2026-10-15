-- PostgreSQL 13+. Table: broadcasts

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_broadcasts_broadcast_type" AS ENUM ('NOTICE', 'ANNOUNCEMENT', 'ALERT', 'EMERGENCY');

CREATE TYPE "public"."enum_broadcasts_audience_type" AS ENUM ('SOCIETY', 'TOWER', 'USERS');

CREATE TYPE "public"."enum_broadcasts_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_broadcasts_status" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'FAILED');

-- broadcasts
CREATE TABLE "broadcasts" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "created_by" UUID, "updated_by" UUID, "title" VARCHAR(255) NOT NULL, "subject" VARCHAR(255), "message" TEXT NOT NULL, "broadcast_type" "public"."enum_broadcasts_broadcast_type" NOT NULL DEFAULT 'NOTICE', "audience_type" "public"."enum_broadcasts_audience_type" NOT NULL DEFAULT 'SOCIETY', "audience_ids" JSONB, "channels" JSONB NOT NULL DEFAULT '["IN_APP"]', "priority" "public"."enum_broadcasts_priority" NOT NULL DEFAULT 'MEDIUM', "status" "public"."enum_broadcasts_status" NOT NULL DEFAULT 'DRAFT', "scheduled_at" TIMESTAMP WITH TIME ZONE, "start_at" TIMESTAMP WITH TIME ZONE, "end_at" TIMESTAMP WITH TIME ZONE, "sent_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "failed_at" TIMESTAMP WITH TIME ZONE, "attachments" JSONB, "data" JSONB, "reference_type" VARCHAR(100), "reference_id" UUID, "recipient_count" INTEGER NOT NULL DEFAULT 0, "delivered_count" INTEGER NOT NULL DEFAULT 0, "failed_count" INTEGER NOT NULL DEFAULT 0, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "broadcasts_society_id" ON "broadcasts" ("society_id");

CREATE INDEX "broadcasts_created_by" ON "broadcasts" ("created_by");

CREATE INDEX "broadcasts_broadcast_type" ON "broadcasts" ("broadcast_type");

CREATE INDEX "broadcasts_audience_type" ON "broadcasts" ("audience_type");

CREATE INDEX "broadcasts_status" ON "broadcasts" ("status");

CREATE INDEX "broadcasts_priority" ON "broadcasts" ("priority");

CREATE INDEX "broadcasts_scheduled_at" ON "broadcasts" ("scheduled_at");

CREATE INDEX "broadcasts_start_at" ON "broadcasts" ("start_at");

CREATE INDEX "broadcasts_end_at" ON "broadcasts" ("end_at");

CREATE INDEX "broadcasts_reference_type_reference_id" ON "broadcasts" ("reference_type", "reference_id");

