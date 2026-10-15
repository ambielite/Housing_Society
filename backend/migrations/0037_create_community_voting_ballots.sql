-- PostgreSQL 13+. Table: community_voting_ballots

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_voting_ballots_status" AS ENUM ('ISSUED', 'USED', 'VOID');

-- community_voting_ballots
CREATE TABLE "community_voting_ballots" ("id" UUID  DEFAULT gen_random_uuid(), "voting_id" UUID NOT NULL, "eligibility_id" UUID NOT NULL, "ballot_token_hash" VARCHAR(255) NOT NULL UNIQUE, "status" "public"."enum_community_voting_ballots_status" NOT NULL DEFAULT 'ISSUED', "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, PRIMARY KEY ("id"));

CREATE INDEX "community_voting_ballots_voting_id" ON "community_voting_ballots" ("voting_id");

CREATE INDEX "community_voting_ballots_eligibility_id" ON "community_voting_ballots" ("eligibility_id");

