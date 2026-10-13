-- PostgreSQL 13+. Table: lifecycle_audits

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_lifecycle_audits_lifecycle_type" AS ENUM ('MOVE_IN', 'MOVE_OUT');

-- lifecycle_audits
CREATE TABLE "lifecycle_audits" ("id" UUID  DEFAULT gen_random_uuid(), "lifecycle_type" "public"."enum_lifecycle_audits_lifecycle_type" NOT NULL, "lifecycle_id" UUID NOT NULL, "action" VARCHAR(100) NOT NULL, "previous_status" VARCHAR(100), "new_status" VARCHAR(100), "performed_by" UUID, "performed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "remarks" TEXT, "metadata" JSONB, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

