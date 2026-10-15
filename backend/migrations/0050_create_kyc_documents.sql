-- PostgreSQL 13+. Table: kyc_documents

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_kyc_documents_document_type" AS ENUM ('AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'RENT_AGREEMENT', 'SALE_DEED', 'PROPERTY_DOCUMENT', 'ADDRESS_PROOF', 'IDENTITY_PROOF', 'OTHER');

CREATE TYPE "public"."enum_kyc_documents_verification_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUEST_MORE_INFORMATION');

CREATE TYPE "public"."enum_kyc_documents_access_level" AS ENUM ('ADMIN_ONLY', 'MANAGEMENT', 'AUTHORIZED_STAFF');

-- kyc_documents
CREATE TABLE "kyc_documents" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "stakeholder_id" UUID NOT NULL, "document_type" "public"."enum_kyc_documents_document_type" NOT NULL, "document_number" VARCHAR(150), "document_name" VARCHAR(255) NOT NULL, "file_name" VARCHAR(255), "file_path" TEXT, "file_url" TEXT, "mime_type" VARCHAR(100), "file_size" BIGINT, "issued_date" DATE, "expiry_date" DATE, "verification_status" "public"."enum_kyc_documents_verification_status" NOT NULL DEFAULT 'PENDING', "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL, "verified_at" TIMESTAMP WITH TIME ZONE, "verified_by" UUID, "verification_remarks" TEXT, "is_sensitive" BOOLEAN NOT NULL DEFAULT true, "access_level" "public"."enum_kyc_documents_access_level" NOT NULL DEFAULT 'ADMIN_ONLY', "is_archived" BOOLEAN NOT NULL DEFAULT false, "archived_at" TIMESTAMP WITH TIME ZONE, "archived_by" UUID, "metadata" JSONB DEFAULT '{}', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "kyc_documents_society_id" ON "kyc_documents" ("society_id");

CREATE INDEX "kyc_documents_stakeholder_id" ON "kyc_documents" ("stakeholder_id");

CREATE INDEX "kyc_documents_document_type" ON "kyc_documents" ("document_type");

CREATE INDEX "kyc_documents_verification_status" ON "kyc_documents" ("verification_status");

CREATE INDEX "kyc_documents_expiry_date" ON "kyc_documents" ("expiry_date");

CREATE INDEX "kyc_documents_is_archived" ON "kyc_documents" ("is_archived");

