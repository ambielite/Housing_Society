-- PostgreSQL 13+. Table: organizations

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_organizations_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- organizations
CREATE TABLE "organizations" ("id" UUID  DEFAULT gen_random_uuid(), "name" VARCHAR(255) NOT NULL, "code" VARCHAR(50) NOT NULL UNIQUE, "description" TEXT, "status" "public"."enum_organizations_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "organizations_code" ON "organizations" ("code");

CREATE INDEX "organizations_status" ON "organizations" ("status");

