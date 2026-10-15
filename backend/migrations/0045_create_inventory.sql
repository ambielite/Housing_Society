-- PostgreSQL 13+. Table: inventory

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_inventory_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- inventory
CREATE TABLE "inventory" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "item_code" VARCHAR(100) NOT NULL, "item_name" VARCHAR(255) NOT NULL, "category" VARCHAR(150), "description" TEXT, "unit_of_measure" VARCHAR(50) NOT NULL, "current_stock" DECIMAL(14,3) NOT NULL DEFAULT 0, "minimum_stock_level" DECIMAL(14,3) NOT NULL DEFAULT 0, "reorder_level" DECIMAL(14,3) NOT NULL DEFAULT 0, "maximum_stock_level" DECIMAL(14,3), "unit_cost" DECIMAL(14,2), "storage_location" VARCHAR(255), "bin_number" VARCHAR(100), "vendor_id" UUID, "last_stock_in_date" DATE, "last_stock_out_date" DATE, "status" "public"."enum_inventory_status" NOT NULL DEFAULT 'ACTIVE', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "inventory_society_id_item_code" ON "inventory" ("society_id", "item_code");

CREATE UNIQUE INDEX "inventory_society_id_item_name" ON "inventory" ("society_id", "item_name");

CREATE INDEX "inventory_society_id" ON "inventory" ("society_id");

CREATE INDEX "inventory_category" ON "inventory" ("category");

CREATE INDEX "inventory_status" ON "inventory" ("status");

CREATE INDEX "inventory_vendor_id" ON "inventory" ("vendor_id");

CREATE INDEX "inventory_storage_location" ON "inventory" ("storage_location");

