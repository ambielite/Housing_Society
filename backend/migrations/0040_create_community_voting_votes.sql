-- PostgreSQL 13+. Table: community_voting_votes

-- Includes this table's enum types, columns and indexes.

-- community_voting_votes
CREATE TABLE "community_voting_votes" ("id" UUID  DEFAULT gen_random_uuid(), "voting_id" UUID NOT NULL, "ballot_id" UUID NOT NULL, "option_id" UUID NOT NULL, "cast_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "community_voting_votes_ballot_id" ON "community_voting_votes" ("ballot_id");

CREATE INDEX "community_voting_votes_voting_id" ON "community_voting_votes" ("voting_id");

CREATE INDEX "community_voting_votes_option_id" ON "community_voting_votes" ("option_id");

