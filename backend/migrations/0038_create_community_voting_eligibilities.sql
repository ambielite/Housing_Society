-- PostgreSQL 13+. Table: community_voting_eligibilities

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_voting_eligibilities_eligibility_status" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'SUSPENDED');

-- community_voting_eligibilities
CREATE TABLE "community_voting_eligibilities" ("id" UUID  DEFAULT gen_random_uuid(), "voting_id" UUID NOT NULL, "user_id" UUID NOT NULL, "eligibility_status" "public"."enum_community_voting_eligibilities_eligibility_status" NOT NULL DEFAULT 'ELIGIBLE', "reason" TEXT, "has_voted" BOOLEAN NOT NULL DEFAULT false, "voted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "community_voting_eligibilities_voting_id_user_id" ON "community_voting_eligibilities" ("voting_id", "user_id");

CREATE INDEX "community_voting_eligibilities_voting_id" ON "community_voting_eligibilities" ("voting_id");

CREATE INDEX "community_voting_eligibilities_user_id" ON "community_voting_eligibilities" ("user_id");

