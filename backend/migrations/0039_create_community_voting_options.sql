-- PostgreSQL 13+. Table: community_voting_options

-- Includes this table's enum types, columns and indexes.

-- community_voting_options
CREATE TABLE "community_voting_options" ("id" UUID  DEFAULT gen_random_uuid(), "voting_id" UUID NOT NULL, "option_code" VARCHAR(50) NOT NULL, "option_label" VARCHAR(255) NOT NULL, "description" TEXT, "display_order" INTEGER NOT NULL DEFAULT 0, "vote_count" INTEGER NOT NULL DEFAULT 0, "is_active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, PRIMARY KEY ("id"));

CREATE INDEX "community_voting_options_voting_id" ON "community_voting_options" ("voting_id");

CREATE INDEX "community_voting_options_option_code" ON "community_voting_options" ("option_code");

