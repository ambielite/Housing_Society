-- PostgreSQL 13+. Table: community_meeting_minutes

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_meeting_minutes_status" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- community_meeting_minutes
CREATE TABLE "community_meeting_minutes" ("id" UUID  DEFAULT gen_random_uuid(), "meeting_id" UUID NOT NULL UNIQUE, "prepared_by" UUID NOT NULL, "approved_by" UUID, "summary" TEXT NOT NULL, "discussion_summary" TEXT, "decisions" JSONB DEFAULT '[]', "attachments" JSONB DEFAULT '[]', "status" "public"."enum_community_meeting_minutes_status" NOT NULL DEFAULT 'DRAFT', "approval_note" TEXT, "approved_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "community_meeting_minutes_meeting_id" ON "community_meeting_minutes" ("meeting_id");

CREATE INDEX "community_meeting_minutes_prepared_by" ON "community_meeting_minutes" ("prepared_by");

CREATE INDEX "community_meeting_minutes_status" ON "community_meeting_minutes" ("status");

