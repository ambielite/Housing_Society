-- PostgreSQL 13+. Table: community_classifieds

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_classifieds_category" AS ENUM ('FOR_SALE', 'FOR_RENT', 'WANTED', 'SERVICES', 'FREE');

CREATE TYPE "public"."enum_community_classifieds_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'SOLD', 'EXPIRED', 'REMOVED');

-- community_classifieds
CREATE TABLE "community_classifieds" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "seller_id" UUID NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT NOT NULL, "category" "public"."enum_community_classifieds_category" NOT NULL, "price" DECIMAL(12,2), "is_negotiable" BOOLEAN NOT NULL DEFAULT false, "contact_name" VARCHAR(150), "contact_phone" VARCHAR(30), "contact_email" VARCHAR(255), "images" JSONB DEFAULT '[]', "status" "public"."enum_community_classifieds_status" NOT NULL DEFAULT 'DRAFT', "moderation_note" TEXT, "approved_by" UUID, "approved_at" TIMESTAMP WITH TIME ZONE, "rejected_by" UUID, "rejected_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE, "sold_at" TIMESTAMP WITH TIME ZONE, "removed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_classifieds_society_id" ON "community_classifieds" ("society_id");

CREATE INDEX "community_classifieds_seller_id" ON "community_classifieds" ("seller_id");

CREATE INDEX "community_classifieds_category" ON "community_classifieds" ("category");

CREATE INDEX "community_classifieds_status" ON "community_classifieds" ("status");

CREATE INDEX "community_classifieds_expires_at" ON "community_classifieds" ("expires_at");

CREATE INDEX "community_classifieds_created_at" ON "community_classifieds" ("created_at");

