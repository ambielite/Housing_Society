-- PostgreSQL 13+. Table: community_group_members

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_group_members_role" AS ENUM ('ADMIN', 'MODERATOR', 'MEMBER');

CREATE TYPE "public"."enum_community_group_members_status" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED');

-- community_group_members
CREATE TABLE "community_group_members" ("id" UUID  DEFAULT gen_random_uuid(), "group_id" UUID NOT NULL, "user_id" UUID NOT NULL, "role" "public"."enum_community_group_members_role" NOT NULL DEFAULT 'MEMBER', "status" "public"."enum_community_group_members_status" NOT NULL DEFAULT 'ACTIVE', "joined_at" TIMESTAMP WITH TIME ZONE, "removed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_group_members_group_id" ON "community_group_members" ("group_id");

CREATE INDEX "community_group_members_user_id" ON "community_group_members" ("user_id");

CREATE INDEX "community_group_members_status" ON "community_group_members" ("status");

CREATE UNIQUE INDEX "community_group_members_group_id_user_id" ON "community_group_members" ("group_id", "user_id");

