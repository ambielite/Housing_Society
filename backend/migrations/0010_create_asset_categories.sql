-- PostgreSQL 13+. Table: asset_categories

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_asset_categories_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- asset_categories
CREATE TABLE "asset_categories" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "category_code" VARCHAR(100) NOT NULL, "category_name" VARCHAR(150) NOT NULL, "description" TEXT, "status" "public"."enum_asset_categories_status" NOT NULL DEFAULT 'ACTIVE', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "asset_categories_society_id_category_code" ON "asset_categories" ("society_id", "category_code")

CREATE UNIQUE INDEX "asset_categories_society_id_category_name" ON "asset_categories" ("society_id", "category_name")

CREATE INDEX "asset_categories_society_id" ON "asset_categories" ("society_id")

CREATE INDEX "asset_categories_status" ON "asset_categories" ("status")

