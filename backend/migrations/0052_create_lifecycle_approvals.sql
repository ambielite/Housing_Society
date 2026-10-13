-- PostgreSQL 13+. Table: lifecycle_approvals

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_lifecycle_approvals_lifecycle_type" AS ENUM ('MOVE_IN', 'MOVE_OUT');

CREATE TYPE "public"."enum_lifecycle_approvals_approval_type" AS ENUM ('DOCUMENT_VERIFICATION', 'MOVE_IN_APPROVAL', 'MOVE_OUT_APPROVAL', 'FINANCIAL_CLEARANCE');

CREATE TYPE "public"."enum_lifecycle_approvals_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- lifecycle_approvals
CREATE TABLE "lifecycle_approvals" ("id" UUID  DEFAULT gen_random_uuid(), "lifecycle_type" "public"."enum_lifecycle_approvals_lifecycle_type" NOT NULL, "lifecycle_id" UUID NOT NULL, "approval_type" "public"."enum_lifecycle_approvals_approval_type" NOT NULL, "status" "public"."enum_lifecycle_approvals_status" NOT NULL DEFAULT 'PENDING', "assigned_to" UUID, "action_by" UUID, "action_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

