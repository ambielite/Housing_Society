-- PostgreSQL 13+. Table: multi_society_access

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_multi_society_access_access_level" AS ENUM ('ORGANIZATION', 'CLUSTER', 'SOCIETY');

CREATE TYPE "public"."enum_multi_society_access_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- multi_society_access
CREATE TABLE "multi_society_access" ("id" UUID  DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "organization_id" UUID, "cluster_id" UUID, "society_id" UUID, "access_level" "public"."enum_multi_society_access_access_level" NOT NULL, "role" VARCHAR(100) NOT NULL, "status" "public"."enum_multi_society_access_status" NOT NULL DEFAULT 'ACTIVE', "start_date" DATE, "end_date" DATE, "created_by" UUID, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "multi_society_access_user_id" ON "multi_society_access" ("user_id")

CREATE INDEX "multi_society_access_organization_id" ON "multi_society_access" ("organization_id")

CREATE INDEX "multi_society_access_cluster_id" ON "multi_society_access" ("cluster_id")

CREATE INDEX "multi_society_access_society_id" ON "multi_society_access" ("society_id")

CREATE INDEX "multi_society_access_access_level" ON "multi_society_access" ("access_level")

CREATE INDEX "multi_society_access_status" ON "multi_society_access" ("status")

