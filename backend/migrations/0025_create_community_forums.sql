-- PostgreSQL 13+. Table: community_forums

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_forums_visibility" AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TYPE "public"."enum_community_forums_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- community_forums
CREATE TABLE "community_forums" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "name" VARCHAR(150) NOT NULL, "description" TEXT, "category" VARCHAR(100), "visibility" "public"."enum_community_forums_visibility" NOT NULL DEFAULT 'PUBLIC', "status" "public"."enum_community_forums_status" NOT NULL DEFAULT 'ACTIVE', "created_by" UUID, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_forums_society_id" ON "community_forums" ("society_id")

CREATE INDEX "community_forums_category" ON "community_forums" ("category")

CREATE INDEX "community_forums_status" ON "community_forums" ("status")

CREATE UNIQUE INDEX "community_forums_society_id_name" ON "community_forums" ("society_id", "name")

