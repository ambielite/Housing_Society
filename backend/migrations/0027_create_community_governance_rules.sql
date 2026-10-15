-- PostgreSQL 13+. Table: community_governance_rules

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_governance_rules_rule_type" AS ENUM ('QUORUM', 'ELIGIBILITY', 'VOTING', 'NOTICE', 'TERM', 'OTHER');

-- community_governance_rules
CREATE TABLE "community_governance_rules" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "rule_code" VARCHAR(100) NOT NULL, "rule_name" VARCHAR(255) NOT NULL, "rule_type" "public"."enum_community_governance_rules_rule_type" NOT NULL, "configuration" JSONB NOT NULL DEFAULT '{}', "is_active" BOOLEAN NOT NULL DEFAULT true, "effective_from" DATE, "effective_to" DATE, "created_by" UUID, "updated_by" UUID, "created_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE, PRIMARY KEY ("id"));

CREATE INDEX "community_governance_rules_society_id" ON "community_governance_rules" ("society_id");

CREATE INDEX "community_governance_rules_rule_code" ON "community_governance_rules" ("rule_code");

CREATE INDEX "community_governance_rules_rule_type" ON "community_governance_rules" ("rule_type");

CREATE INDEX "community_governance_rules_is_active" ON "community_governance_rules" ("is_active");

