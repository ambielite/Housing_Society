-- PostgreSQL 13+. Table: clusters

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_clusters_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- clusters
CREATE TABLE "clusters" ("id" UUID  DEFAULT gen_random_uuid(), "organization_id" UUID NOT NULL, "name" VARCHAR(255) NOT NULL, "code" VARCHAR(50) NOT NULL, "description" TEXT, "status" "public"."enum_clusters_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "clusters_organization_id_code" ON "clusters" ("organization_id", "code")

CREATE INDEX "clusters_organization_id" ON "clusters" ("organization_id")

CREATE INDEX "clusters_status" ON "clusters" ("status")

