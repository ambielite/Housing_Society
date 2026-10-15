-- PostgreSQL 13+. Table: staff_documents

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_staff_documents_document_type" AS ENUM ('ID_PROOF', 'PAN', 'ADDRESS_PROOF', 'POLICE_VERIFICATION', 'EMPLOYMENT_PROOF', 'CONTRACT', 'MEDICAL_CERTIFICATE', 'OTHER');

CREATE TYPE "public"."enum_staff_documents_verification_status" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- staff_documents
CREATE TABLE "staff_documents" ("id" UUID  DEFAULT gen_random_uuid(), "staff_id" UUID NOT NULL, "document_type" "public"."enum_staff_documents_document_type" NOT NULL, "document_number" VARCHAR(100), "document_path" VARCHAR(500) NOT NULL, "issue_date" DATE, "expiry_date" DATE, "verification_status" "public"."enum_staff_documents_verification_status" NOT NULL DEFAULT 'PENDING', "verified_by" UUID, "verified_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "staff_documents_staff_id" ON "staff_documents" ("staff_id");

CREATE INDEX "staff_documents_document_type" ON "staff_documents" ("document_type");

CREATE INDEX "staff_documents_verification_status" ON "staff_documents" ("verification_status");

CREATE INDEX "staff_documents_expiry_date" ON "staff_documents" ("expiry_date");

