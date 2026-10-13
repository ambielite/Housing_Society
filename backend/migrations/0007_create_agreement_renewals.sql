-- PostgreSQL 13+. Table: agreement_renewals

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_agreement_renewals_status" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- agreement_renewals
CREATE TABLE "agreement_renewals" ("id" UUID  DEFAULT gen_random_uuid(), "agreement_id" UUID NOT NULL, "existing_agreement_reference" VARCHAR(100) NOT NULL, "current_expiry_date" DATE NOT NULL, "proposed_start_date" DATE NOT NULL, "proposed_expiry_date" DATE NOT NULL, "updated_agreement_details" JSONB, "updated_documents" JSONB, "renewal_agreement_copy" TEXT, "status" "public"."enum_agreement_renewals_status" NOT NULL DEFAULT 'DRAFT', "application_date" TIMESTAMP WITH TIME ZONE, "approval_date" TIMESTAMP WITH TIME ZONE, "requested_by" UUID, "approved_by" UUID, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

