-- PostgreSQL 13+. Table: towers

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_towers_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- towers
CREATE TABLE "towers" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "name" VARCHAR(255) NOT NULL, "floor_count" INTEGER NOT NULL, "status" "public"."enum_towers_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "towers_society_id_name" ON "towers" ("society_id", "name");

