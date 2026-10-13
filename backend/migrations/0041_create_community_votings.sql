-- PostgreSQL 13+. Table: community_votings

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_votings_voting_type" AS ENUM ('RESOLUTION', 'ELECTION', 'POLL', 'AGM', 'SGM', 'OTHER');

CREATE TYPE "public"."enum_community_votings_ballot_type" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO', 'ELECTION');

CREATE TYPE "public"."enum_community_votings_secrecy" AS ENUM ('OPEN', 'SECRET');

CREATE TYPE "public"."enum_community_votings_status" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'COUNTING', 'RESULT_DECLARED', 'CANCELLED');

-- community_votings
CREATE TABLE "community_votings" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "governance_meeting_id" UUID, "meeting_id" UUID, "title" VARCHAR(255) NOT NULL, "description" TEXT, "voting_type" "public"."enum_community_votings_voting_type" NOT NULL, "ballot_type" "public"."enum_community_votings_ballot_type" NOT NULL DEFAULT 'SINGLE_CHOICE', "secrecy" "public"."enum_community_votings_secrecy" NOT NULL DEFAULT 'SECRET', "status" "public"."enum_community_votings_status" NOT NULL DEFAULT 'DRAFT', "start_at" TIMESTAMP WITH TIME ZONE, "end_at" TIMESTAMP WITH TIME ZONE, "quorum_required" INTEGER NOT NULL DEFAULT 0, "quorum_reached" BOOLEAN NOT NULL DEFAULT false, "eligible_voter_count" INTEGER NOT NULL DEFAULT 0, "vote_count" INTEGER NOT NULL DEFAULT 0, "result_data" JSONB, "created_by" UUID, "updated_by" UUID, "result_declared_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancellation_reason" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_votings_society_id" ON "community_votings" ("society_id")

CREATE INDEX "community_votings_governance_meeting_id" ON "community_votings" ("governance_meeting_id")

CREATE INDEX "community_votings_meeting_id" ON "community_votings" ("meeting_id")

CREATE INDEX "community_votings_voting_type" ON "community_votings" ("voting_type")

CREATE INDEX "community_votings_status" ON "community_votings" ("status")

CREATE INDEX "community_votings_start_at" ON "community_votings" ("start_at")

CREATE INDEX "community_votings_end_at" ON "community_votings" ("end_at")

