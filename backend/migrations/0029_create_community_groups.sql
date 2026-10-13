-- PostgreSQL 13+. Table: community_groups

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_groups_visibility" AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TYPE "public"."enum_community_groups_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- community_groups
CREATE TABLE "community_groups" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "name" VARCHAR(150) NOT NULL, "description" TEXT, "category" VARCHAR(100), "visibility" "public"."enum_community_groups_visibility" NOT NULL DEFAULT 'PUBLIC', "rules" JSONB, "created_by" UUID, "group_admin_id" UUID, "status" "public"."enum_community_groups_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_groups_society_id" ON "community_groups" ("society_id")

CREATE INDEX "community_groups_category" ON "community_groups" ("category")

CREATE INDEX "community_groups_status" ON "community_groups" ("status")

CREATE UNIQUE INDEX "community_groups_society_id_name" ON "community_groups" ("society_id", "name")

