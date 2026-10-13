-- PostgreSQL 13+. Table: assets

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_assets_status" AS ENUM ('PURCHASED', 'ACTIVE', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED', 'DISPOSED');

CREATE TYPE "public"."enum_assets_condition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'DAMAGED', 'CRITICAL');

-- assets
CREATE TABLE "assets" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "asset_code" VARCHAR(100) NOT NULL, "asset_name" VARCHAR(255) NOT NULL, "asset_type" VARCHAR(100) NOT NULL, "category_id" UUID, "description" TEXT, "purchase_date" DATE, "purchase_cost" DECIMAL(14,2), "invoice_number" VARCHAR(100), "serial_number" VARCHAR(150), "model_number" VARCHAR(150), "manufacturer" VARCHAR(150), "vendor_id" UUID, "location" VARCHAR(255), "tower_id" UUID, "floor_id" UUID, "unit_id" UUID, "commissioned_date" DATE, "status" "public"."enum_assets_status" NOT NULL DEFAULT 'PURCHASED', "condition" "public"."enum_assets_condition" NOT NULL DEFAULT 'NEW', "current_value" DECIMAL(14,2), "depreciation_value" DECIMAL(14,2), "retirement_date" DATE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "assets_society_id_asset_code" ON "assets" ("society_id", "asset_code")

CREATE INDEX "assets_society_id" ON "assets" ("society_id")

CREATE INDEX "assets_asset_type" ON "assets" ("asset_type")

CREATE INDEX "assets_status" ON "assets" ("status")

CREATE INDEX "assets_tower_id" ON "assets" ("tower_id")

CREATE INDEX "assets_floor_id" ON "assets" ("floor_id")

CREATE INDEX "assets_unit_id" ON "assets" ("unit_id")

CREATE INDEX "assets_purchase_date" ON "assets" ("purchase_date")

