-- PostgreSQL 13+. Table: community_meeting_agendas

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_meeting_agendas_status" AS ENUM ('OPEN', 'DISCUSSED', 'DEFERRED', 'CLOSED');

-- community_meeting_agendas
CREATE TABLE "community_meeting_agendas" ("id" UUID  DEFAULT gen_random_uuid(), "meeting_id" UUID NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT, "agenda_order" INTEGER NOT NULL DEFAULT 1, "discussion_required" BOOLEAN NOT NULL DEFAULT true, "decision_required" BOOLEAN NOT NULL DEFAULT false, "status" "public"."enum_community_meeting_agendas_status" NOT NULL DEFAULT 'OPEN', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_meeting_agendas_meeting_id" ON "community_meeting_agendas" ("meeting_id");

CREATE INDEX "community_meeting_agendas_agenda_order" ON "community_meeting_agendas" ("agenda_order");

CREATE INDEX "community_meeting_agendas_status" ON "community_meeting_agendas" ("status");

