-- PostgreSQL 13+. Table: asset_qr_tags

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_asset_qr_tags_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- asset_qr_tags
CREATE TABLE "asset_qr_tags" ("id" UUID  DEFAULT gen_random_uuid(), "asset_id" UUID NOT NULL UNIQUE, "qr_code" VARCHAR(150) NOT NULL UNIQUE, "qr_value" TEXT NOT NULL UNIQUE, "qr_image_path" VARCHAR(500), "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."enum_asset_qr_tags_status" NOT NULL DEFAULT 'ACTIVE', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "asset_qr_tags_asset_id" ON "asset_qr_tags" ("asset_id");

CREATE UNIQUE INDEX "asset_qr_tags_qr_code" ON "asset_qr_tags" ("qr_code");

CREATE UNIQUE INDEX "asset_qr_tags_qr_value" ON "asset_qr_tags" ("qr_value");

CREATE INDEX "asset_qr_tags_status" ON "asset_qr_tags" ("status");

