-- PostgreSQL 13+. Table: vendors

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_vendors_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');

-- vendors
CREATE TABLE "vendors" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "vendor_code" VARCHAR(100) NOT NULL, "company_name" VARCHAR(255) NOT NULL, "contact_person" VARCHAR(150), "phone" VARCHAR(30), "email" VARCHAR(150), "address" TEXT, "gstin" VARCHAR(20), "pan" VARCHAR(20), "service_type" VARCHAR(150), "status" "public"."enum_vendors_status" NOT NULL DEFAULT 'ACTIVE', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "vendors_society_id_vendor_code" ON "vendors" ("society_id", "vendor_code")

CREATE INDEX "vendors_society_id" ON "vendors" ("society_id")

CREATE INDEX "vendors_company_name" ON "vendors" ("company_name")

CREATE INDEX "vendors_status" ON "vendors" ("status")

CREATE INDEX "vendors_service_type" ON "vendors" ("service_type")

