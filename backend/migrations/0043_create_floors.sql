-- PostgreSQL 13+. Table: floors

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_floors_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- floors
CREATE TABLE "floors" ("id" UUID  DEFAULT gen_random_uuid(), "tower_id" UUID NOT NULL, "floor_number" INTEGER NOT NULL, "name" VARCHAR(100), "status" "public"."enum_floors_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "floors_tower_id_floor_number" ON "floors" ("tower_id", "floor_number");

