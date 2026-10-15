-- PostgreSQL 13+. Table: community_moderations

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_moderations_content_type" AS ENUM ('POST', 'COMMENT');

CREATE TYPE "public"."enum_community_moderations_reason" AS ENUM ('SPAM', 'ABUSE', 'HARASSMENT', 'OFFENSIVE', 'MISINFORMATION', 'ILLEGAL_CONTENT', 'ADVERTISEMENT', 'DUPLICATE', 'OTHER');

CREATE TYPE "public"."enum_community_moderations_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_community_moderations_status" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

CREATE TYPE "public"."enum_community_moderations_action" AS ENUM ('NONE', 'HIDE', 'UNHIDE', 'DELETE', 'WARN', 'DISMISS');

-- community_moderations
CREATE TABLE "community_moderations" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "reporter_id" UUID NOT NULL, "content_type" "public"."enum_community_moderations_content_type" NOT NULL, "content_id" UUID NOT NULL, "reason" "public"."enum_community_moderations_reason" NOT NULL, "description" TEXT, "priority" "public"."enum_community_moderations_priority" NOT NULL DEFAULT 'MEDIUM', "status" "public"."enum_community_moderations_status" NOT NULL DEFAULT 'PENDING', "action" "public"."enum_community_moderations_action" NOT NULL DEFAULT 'NONE', "moderator_id" UUID, "moderation_note" TEXT, "reviewed_at" TIMESTAMP WITH TIME ZONE, "resolved_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_moderations_society_id" ON "community_moderations" ("society_id");

CREATE INDEX "community_moderations_reporter_id" ON "community_moderations" ("reporter_id");

CREATE INDEX "community_moderations_content_type" ON "community_moderations" ("content_type");

CREATE INDEX "community_moderations_content_id" ON "community_moderations" ("content_id");

CREATE INDEX "community_moderations_status" ON "community_moderations" ("status");

CREATE INDEX "community_moderations_priority" ON "community_moderations" ("priority");

CREATE INDEX "community_moderations_moderator_id" ON "community_moderations" ("moderator_id");

