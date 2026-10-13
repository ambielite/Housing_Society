-- PostgreSQL 13+. Table: agreements

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_agreements_agreement_type" AS ENUM ('RENTAL', 'LEASE', 'TENANCY', 'LEAVE_AND_LICENSE', 'OTHER');

CREATE TYPE "public"."enum_agreements_status" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION', 'APPROVED', 'ACTIVE', 'EXPIRING_SOON', 'RENEWAL_INITIATED', 'RENEWED', 'EXPIRED', 'TERMINATED');

CREATE TYPE "public"."enum_agreements_renewal_status" AS ENUM ('NOT_REQUIRED', 'PENDING', 'INITIATED', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'RENEWED');

-- agreements
CREATE TABLE "agreements" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "owner_id" UUID, "tenant_id" UUID, "agreement_reference" VARCHAR(100) NOT NULL UNIQUE, "agreement_type" "public"."enum_agreements_agreement_type" NOT NULL, "start_date" DATE NOT NULL, "expiry_date" DATE NOT NULL, "duration" INTEGER , "status" "public"."enum_agreements_status" NOT NULL DEFAULT 'DRAFT', "agreement_document" TEXT, "signed_agreement_copy" TEXT, "uploaded_at" TIMESTAMP WITH TIME ZONE, "signed_at" TIMESTAMP WITH TIME ZONE, "renewal_status" "public"."enum_agreements_renewal_status" NOT NULL DEFAULT 'NOT_REQUIRED', "renewal_application_date" TIMESTAMP WITH TIME ZONE, "renewal_approval_date" TIMESTAMP WITH TIME ZONE, "renewal_agreement_document" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id")); COMMENT ON COLUMN "agreements"."duration" IS 'Agreement duration in months';

