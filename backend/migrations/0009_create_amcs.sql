-- PostgreSQL 13+. Table: amcs

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_amcs_status" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRING_SOON', 'RENEWAL_INITIATED', 'RENEWED', 'EXPIRED', 'TERMINATED');

-- amcs
CREATE TABLE "amcs" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "amc_number" VARCHAR(100) NOT NULL, "vendor_id" UUID NOT NULL, "asset_id" UUID NOT NULL, "start_date" DATE NOT NULL, "end_date" DATE NOT NULL, "contract_cost" DECIMAL(14,2) NOT NULL, "sla" TEXT, "response_time" INTEGER , "resolution_time" INTEGER , "renewal_required" BOOLEAN NOT NULL DEFAULT true, "renewal_date" DATE, "parent_amc_id" UUID, "status" "public"."enum_amcs_status" NOT NULL DEFAULT 'DRAFT', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id")); COMMENT ON COLUMN "amcs"."response_time" IS 'Response time in hours'; COMMENT ON COLUMN "amcs"."resolution_time" IS 'Resolution time in hours';

CREATE UNIQUE INDEX "amcs_society_id_amc_number" ON "amcs" ("society_id", "amc_number");

CREATE INDEX "amcs_society_id" ON "amcs" ("society_id");

CREATE INDEX "amcs_vendor_id" ON "amcs" ("vendor_id");

CREATE INDEX "amcs_asset_id" ON "amcs" ("asset_id");

CREATE INDEX "amcs_start_date" ON "amcs" ("start_date");

CREATE INDEX "amcs_end_date" ON "amcs" ("end_date");

CREATE INDEX "amcs_status" ON "amcs" ("status");

