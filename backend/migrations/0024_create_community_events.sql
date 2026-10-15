-- PostgreSQL 13+. Table: community_events

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_events_category" AS ENUM ('SOCIAL', 'SPORTS', 'CULTURAL', 'EDUCATIONAL', 'FESTIVAL', 'MEETING', 'WORKSHOP', 'OTHER');

CREATE TYPE "public"."enum_community_events_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'EXPIRED');

-- community_events
CREATE TABLE "community_events" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "created_by" UUID NOT NULL, "approved_by" UUID, "title" VARCHAR(255) NOT NULL, "description" TEXT NOT NULL, "category" "public"."enum_community_events_category" NOT NULL, "venue" VARCHAR(255) NOT NULL, "start_at" TIMESTAMP WITH TIME ZONE NOT NULL, "end_at" TIMESTAMP WITH TIME ZONE NOT NULL, "registration_start_at" TIMESTAMP WITH TIME ZONE, "registration_end_at" TIMESTAMP WITH TIME ZONE, "capacity" INTEGER, "is_free" BOOLEAN NOT NULL DEFAULT true, "ticket_price" DECIMAL(10,2), "image_url" VARCHAR(1000), "status" "public"."enum_community_events_status" NOT NULL DEFAULT 'DRAFT', "approved_at" TIMESTAMP WITH TIME ZONE, "published_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "cancellation_reason" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_events_society_id" ON "community_events" ("society_id");

CREATE INDEX "community_events_created_by" ON "community_events" ("created_by");

CREATE INDEX "community_events_category" ON "community_events" ("category");

CREATE INDEX "community_events_status" ON "community_events" ("status");

CREATE INDEX "community_events_start_at" ON "community_events" ("start_at");

CREATE INDEX "community_events_registration_start_at" ON "community_events" ("registration_start_at");

CREATE INDEX "community_events_registration_end_at" ON "community_events" ("registration_end_at");

