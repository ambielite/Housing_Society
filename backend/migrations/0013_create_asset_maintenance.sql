-- PostgreSQL 13+. Table: asset_maintenance

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_asset_maintenance_maintenance_type" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN', 'INSPECTION', 'SERVICING', 'REPAIR', 'OTHER');

CREATE TYPE "public"."enum_asset_maintenance_maintenance_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- asset_maintenance
CREATE TABLE "asset_maintenance" ("id" UUID  DEFAULT gen_random_uuid(), "asset_id" UUID NOT NULL, "maintenance_type" "public"."enum_asset_maintenance_maintenance_type" NOT NULL, "maintenance_status" "public"."enum_asset_maintenance_maintenance_status" NOT NULL DEFAULT 'SCHEDULED', "service_date" DATE NOT NULL, "completion_date" DATE, "issue_reported" TEXT, "work_performed" TEXT, "technician_name" VARCHAR(150), "technician_contact" VARCHAR(30), "vendor_id" UUID, "invoice_number" VARCHAR(100), "maintenance_cost" DECIMAL(14,2), "parts_cost" DECIMAL(14,2), "labor_cost" DECIMAL(14,2), "downtime_hours" DECIMAL(10,2), "next_service_date" DATE, "warranty_covered" BOOLEAN NOT NULL DEFAULT false, "warranty_claim_number" VARCHAR(150), "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "asset_maintenance_asset_id" ON "asset_maintenance" ("asset_id");

CREATE INDEX "asset_maintenance_maintenance_type" ON "asset_maintenance" ("maintenance_type");

CREATE INDEX "asset_maintenance_maintenance_status" ON "asset_maintenance" ("maintenance_status");

CREATE INDEX "asset_maintenance_service_date" ON "asset_maintenance" ("service_date");

CREATE INDEX "asset_maintenance_next_service_date" ON "asset_maintenance" ("next_service_date");

CREATE INDEX "asset_maintenance_vendor_id" ON "asset_maintenance" ("vendor_id");

