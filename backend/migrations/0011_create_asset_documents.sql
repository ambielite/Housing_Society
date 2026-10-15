-- PostgreSQL 13+. Table: asset_documents

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_asset_documents_document_type" AS ENUM ('PURCHASE_INVOICE', 'WARRANTY_CERTIFICATE', 'AMC_DOCUMENT', 'USER_MANUAL', 'SERVICE_DOCUMENT', 'INSURANCE_DOCUMENT', 'OTHER');

CREATE TYPE "public"."enum_asset_documents_status" AS ENUM ('ACTIVE', 'EXPIRED', 'INACTIVE');

-- asset_documents
CREATE TABLE "asset_documents" ("id" UUID  DEFAULT gen_random_uuid(), "asset_id" UUID NOT NULL, "document_type" "public"."enum_asset_documents_document_type" NOT NULL, "document_name" VARCHAR(255) NOT NULL, "document_number" VARCHAR(150), "file_name" VARCHAR(255), "file_path" VARCHAR(500), "file_type" VARCHAR(100), "file_size" BIGINT, "issue_date" DATE, "expiry_date" DATE, "warranty_start_date" DATE, "warranty_end_date" DATE, "warranty_provider" VARCHAR(255), "warranty_remarks" TEXT, "status" "public"."enum_asset_documents_status" NOT NULL DEFAULT 'ACTIVE', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "asset_documents_asset_id" ON "asset_documents" ("asset_id");

CREATE INDEX "asset_documents_document_type" ON "asset_documents" ("document_type");

CREATE INDEX "asset_documents_status" ON "asset_documents" ("status");

CREATE INDEX "asset_documents_expiry_date" ON "asset_documents" ("expiry_date");

CREATE INDEX "asset_documents_warranty_end_date" ON "asset_documents" ("warranty_end_date");

