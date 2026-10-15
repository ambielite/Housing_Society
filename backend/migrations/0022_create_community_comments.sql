-- PostgreSQL 13+. Table: community_comments

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_comments_status" AS ENUM ('PUBLISHED', 'HIDDEN', 'DELETED');

-- community_comments
CREATE TABLE "community_comments" ("id" UUID  DEFAULT gen_random_uuid(), "post_id" UUID NOT NULL, "user_id" UUID NOT NULL, "parent_comment_id" UUID, "content" TEXT NOT NULL, "status" "public"."enum_community_comments_status" NOT NULL DEFAULT 'PUBLISHED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_comments_post_id" ON "community_comments" ("post_id");

CREATE INDEX "community_comments_user_id" ON "community_comments" ("user_id");

CREATE INDEX "community_comments_parent_comment_id" ON "community_comments" ("parent_comment_id");

CREATE INDEX "community_comments_status" ON "community_comments" ("status");

