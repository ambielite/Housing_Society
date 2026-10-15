-- PostgreSQL 13+. Table: community_meeting_action_items

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_meeting_action_items_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_community_meeting_action_items_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- community_meeting_action_items
CREATE TABLE "community_meeting_action_items" ("id" UUID  DEFAULT gen_random_uuid(), "meeting_id" UUID NOT NULL, "agenda_id" UUID, "assigned_to" UUID NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT, "priority" "public"."enum_community_meeting_action_items_priority" NOT NULL DEFAULT 'MEDIUM', "due_date" DATE, "status" "public"."enum_community_meeting_action_items_status" NOT NULL DEFAULT 'OPEN', "completed_at" TIMESTAMP WITH TIME ZONE, "completion_note" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_meeting_action_items_meeting_id" ON "community_meeting_action_items" ("meeting_id");

CREATE INDEX "community_meeting_action_items_agenda_id" ON "community_meeting_action_items" ("agenda_id");

CREATE INDEX "community_meeting_action_items_assigned_to" ON "community_meeting_action_items" ("assigned_to");

CREATE INDEX "community_meeting_action_items_status" ON "community_meeting_action_items" ("status");

CREATE INDEX "community_meeting_action_items_due_date" ON "community_meeting_action_items" ("due_date");

