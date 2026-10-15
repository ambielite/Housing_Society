-- PostgreSQL 13+. Table: community_event_rsvps

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_event_rsvps_payment_status" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

CREATE TYPE "public"."enum_community_event_rsvps_status" AS ENUM ('REGISTERED', 'WAITLISTED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW');

-- community_event_rsvps
CREATE TABLE "community_event_rsvps" ("id" UUID  DEFAULT gen_random_uuid(), "event_id" UUID NOT NULL, "society_id" UUID NOT NULL, "user_id" UUID NOT NULL, "guest_count" INTEGER NOT NULL DEFAULT 0, "total_tickets" INTEGER NOT NULL DEFAULT 1, "ticket_price" DECIMAL(10,2), "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0, "payment_status" "public"."enum_community_event_rsvps_payment_status" NOT NULL DEFAULT 'NOT_REQUIRED', "payment_reference" VARCHAR(255), "status" "public"."enum_community_event_rsvps_status" NOT NULL DEFAULT 'REGISTERED', "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL, "cancelled_at" TIMESTAMP WITH TIME ZONE, "checked_in_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_event_rsvps_event_id" ON "community_event_rsvps" ("event_id");

CREATE INDEX "community_event_rsvps_society_id" ON "community_event_rsvps" ("society_id");

CREATE INDEX "community_event_rsvps_user_id" ON "community_event_rsvps" ("user_id");

CREATE INDEX "community_event_rsvps_status" ON "community_event_rsvps" ("status");

CREATE INDEX "community_event_rsvps_payment_status" ON "community_event_rsvps" ("payment_status");

CREATE UNIQUE INDEX "community_event_rsvps_event_id_user_id" ON "community_event_rsvps" ("event_id", "user_id");

