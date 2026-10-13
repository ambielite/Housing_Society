-- PostgreSQL 13+. Table: lifecycle_documents

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_lifecycle_documents_lifecycle_type" AS ENUM ('MOVE_IN', 'MOVE_OUT');

CREATE TYPE "public"."enum_lifecycle_documents_status" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- lifecycle_documents
CREATE TABLE "lifecycle_documents" ("id" UUID  DEFAULT gen_random_uuid(), "lifecycle_type" "public"."enum_lifecycle_documents_lifecycle_type" NOT NULL, "lifecycle_id" UUID NOT NULL, "document_type" VARCHAR(100) NOT NULL, "document_name" VARCHAR(255) NOT NULL, "document_url" TEXT, "status" "public"."enum_lifecycle_documents_status" NOT NULL DEFAULT 'PENDING_VERIFICATION', "uploaded_by" UUID, "verified_by" UUID, "verified_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

