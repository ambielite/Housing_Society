-- PostgreSQL 13+. Table: asset_lifecycle

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_asset_lifecycle_lifecycle_type" AS ENUM ('WARRANTY_EXPIRY', 'AMC_EXPIRY', 'MAINTENANCE_DUE', 'LOW_STOCK', 'RETIREMENT', 'DISPOSAL');

CREATE TYPE "public"."enum_asset_lifecycle_status" AS ENUM ('PENDING', 'SENT', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

CREATE TYPE "public"."enum_asset_lifecycle_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_asset_lifecycle_notification_type" AS ENUM ('SYSTEM', 'EMAIL', 'SMS', 'PUSH');

-- asset_lifecycle
CREATE TABLE "asset_lifecycle" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "asset_id" UUID NOT NULL, "lifecycle_type" "public"."enum_asset_lifecycle_lifecycle_type" NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT, "due_date" DATE, "reminder_date" DATE, "reminder_days_before" INTEGER, "status" "public"."enum_asset_lifecycle_status" NOT NULL DEFAULT 'PENDING', "priority" "public"."enum_asset_lifecycle_priority" NOT NULL DEFAULT 'MEDIUM', "notification_type" "public"."enum_asset_lifecycle_notification_type" NOT NULL DEFAULT 'SYSTEM', "notification_sent_at" TIMESTAMP WITH TIME ZONE, "acknowledged_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "retirement_date" DATE, "disposal_date" DATE, "disposal_method" VARCHAR(150), "disposal_value" DECIMAL(14,2), "reason" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "asset_lifecycle_society_id" ON "asset_lifecycle" ("society_id")

CREATE INDEX "asset_lifecycle_asset_id" ON "asset_lifecycle" ("asset_id")

CREATE INDEX "asset_lifecycle_lifecycle_type" ON "asset_lifecycle" ("lifecycle_type")

CREATE INDEX "asset_lifecycle_due_date" ON "asset_lifecycle" ("due_date")

CREATE INDEX "asset_lifecycle_reminder_date" ON "asset_lifecycle" ("reminder_date")

CREATE INDEX "asset_lifecycle_status" ON "asset_lifecycle" ("status")

CREATE INDEX "asset_lifecycle_priority" ON "asset_lifecycle" ("priority")

