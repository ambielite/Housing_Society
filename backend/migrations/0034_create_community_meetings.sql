-- PostgreSQL 13+. Table: community_meetings

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_meetings_meeting_type" AS ENUM ('GENERAL', 'COMMITTEE', 'BOARD', 'AGM', 'SGM', 'EMERGENCY', 'OTHER');

CREATE TYPE "public"."enum_community_meetings_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- community_meetings
CREATE TABLE "community_meetings" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "created_by" UUID NOT NULL, "approved_by" UUID, "title" VARCHAR(255) NOT NULL, "description" TEXT, "meeting_type" "public"."enum_community_meetings_meeting_type" NOT NULL DEFAULT 'GENERAL', "venue" VARCHAR(255), "meeting_link" VARCHAR(1000), "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "end_at" TIMESTAMP WITH TIME ZONE, "status" "public"."enum_community_meetings_status" NOT NULL DEFAULT 'DRAFT', "approval_note" TEXT, "cancellation_reason" TEXT, "approved_at" TIMESTAMP WITH TIME ZONE, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_meetings_society_id" ON "community_meetings" ("society_id")

CREATE INDEX "community_meetings_created_by" ON "community_meetings" ("created_by")

CREATE INDEX "community_meetings_meeting_type" ON "community_meetings" ("meeting_type")

CREATE INDEX "community_meetings_status" ON "community_meetings" ("status")

CREATE INDEX "community_meetings_scheduled_at" ON "community_meetings" ("scheduled_at")

