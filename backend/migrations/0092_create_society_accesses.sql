-- PostgreSQL 13+. Restore the society-specific access table used by the legacy
-- society-access module and portfolio access reports.

CREATE TYPE "public"."enum_society_accesses_access_type" AS ENUM (
  'OWNER',
  'ADMIN',
  'MANAGER',
  'DELEGATED_ADMIN',
  'VIEWER'
);

CREATE TABLE "society_accesses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL REFERENCES "organizations" ("id"),
  "cluster_id" UUID REFERENCES "clusters" ("id"),
  "society_id" UUID NOT NULL REFERENCES "societies" ("id"),
  "user_id" UUID NOT NULL REFERENCES "users" ("id"),
  "access_type" "public"."enum_society_accesses_access_type" NOT NULL DEFAULT 'VIEWER',
  "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "valid_from" TIMESTAMP WITH TIME ZONE,
  "valid_until" TIMESTAMP WITH TIME ZONE,
  "permissions" JSONB DEFAULT '{}'::jsonb,
  "remarks" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "society_accesses_user_id_society_id"
  ON "society_accesses" ("user_id", "society_id");
CREATE INDEX "society_accesses_organization_id" ON "society_accesses" ("organization_id");
CREATE INDEX "society_accesses_cluster_id" ON "society_accesses" ("cluster_id");
CREATE INDEX "society_accesses_society_id" ON "society_accesses" ("society_id");
CREATE INDEX "society_accesses_user_id" ON "society_accesses" ("user_id");
