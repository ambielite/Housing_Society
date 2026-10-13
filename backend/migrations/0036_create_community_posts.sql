-- PostgreSQL 13+. Table: community_posts

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_posts_status" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'DELETED');

-- community_posts
CREATE TABLE "community_posts" ("id" UUID  DEFAULT gen_random_uuid(), "forum_id" UUID NOT NULL, "user_id" UUID NOT NULL, "title" VARCHAR(255) NOT NULL, "content" TEXT NOT NULL, "status" "public"."enum_community_posts_status" NOT NULL DEFAULT 'PUBLISHED', "is_pinned" BOOLEAN NOT NULL DEFAULT false, "is_locked" BOOLEAN NOT NULL DEFAULT false, "view_count" INTEGER NOT NULL DEFAULT 0, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_posts_forum_id" ON "community_posts" ("forum_id")

CREATE INDEX "community_posts_user_id" ON "community_posts" ("user_id")

CREATE INDEX "community_posts_status" ON "community_posts" ("status")

CREATE INDEX "community_posts_is_pinned" ON "community_posts" ("is_pinned")

