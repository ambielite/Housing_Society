-- PostgreSQL 13+. Table: community_governance_meetings

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_governance_meetings_governance_type" AS ENUM ('AGM', 'SGM');

CREATE TYPE "public"."enum_community_governance_meetings_status" AS ENUM ('DRAFT', 'NOTICE_PUBLISHED', 'SCHEDULED', 'IN_PROGRESS', 'QUORUM_CONFIRMED', 'COMPLETED', 'MINUTES_PENDING', 'MINUTES_APPROVED', 'CANCELLED');

-- community_governance_meetings
CREATE TABLE "community_governance_meetings" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "meeting_id" UUID NOT NULL, "governance_type" "public"."enum_community_governance_meetings_governance_type" NOT NULL, "meeting_number" VARCHAR(100), "financial_year" VARCHAR(20), "notice_date" TIMESTAMP WITH TIME ZONE, "notice_published_at" TIMESTAMP WITH TIME ZONE, "notice_document" VARCHAR(500), "notice_period_days" INTEGER, "agenda_document" VARCHAR(500), "quorum_required" INTEGER NOT NULL DEFAULT 0, "quorum_reached" BOOLEAN NOT NULL DEFAULT false, "eligible_member_count" INTEGER NOT NULL DEFAULT 0, "present_member_count" INTEGER NOT NULL DEFAULT 0, "status" "public"."enum_community_governance_meetings_status" NOT NULL DEFAULT 'DRAFT', "chairman_id" UUID, "secretary_id" UUID, "created_by" UUID, "updated_by" UUID, "completed_at" TIMESTAMP WITH TIME ZONE, "minutes_approved_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancellation_reason" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_governance_meetings_society_id" ON "community_governance_meetings" ("society_id")

CREATE INDEX "community_governance_meetings_meeting_id" ON "community_governance_meetings" ("meeting_id")

CREATE INDEX "community_governance_meetings_governance_type" ON "community_governance_meetings" ("governance_type")

CREATE INDEX "community_governance_meetings_financial_year" ON "community_governance_meetings" ("financial_year")

CREATE INDEX "community_governance_meetings_status" ON "community_governance_meetings" ("status")

