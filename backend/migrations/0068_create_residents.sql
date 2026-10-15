-- PostgreSQL 13+. Table: residents

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_residents_role" AS ENUM ('PRIMARY_OWNER', 'CO_OWNER', 'TENANT', 'FAMILY_MEMBER', 'PROPERTY_MANAGER');

CREATE TYPE "public"."enum_residents_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED', 'ARCHIVED');

-- residents
CREATE TABLE "residents" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "first_name" VARCHAR(100) NOT NULL, "middle_name" VARCHAR(100), "last_name" VARCHAR(100) NOT NULL, "display_name" VARCHAR(255), "email" VARCHAR(255), "mobile" VARCHAR(20) NOT NULL, "alternate_mobile" VARCHAR(20), "emergency_contact_name" VARCHAR(255), "emergency_contact_mobile" VARCHAR(20), "emergency_contact_relation" VARCHAR(100), "role" "public"."enum_residents_role" NOT NULL, "status" "public"."enum_residents_status" NOT NULL DEFAULT 'PENDING', "directory_phone_visible" BOOLEAN NOT NULL DEFAULT false, "personal_fields" JSONB DEFAULT '{}', "profile_photo" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "residents_society_id" ON "residents" ("society_id");

CREATE INDEX "residents_mobile" ON "residents" ("mobile");

CREATE INDEX "residents_email" ON "residents" ("email");

CREATE INDEX "residents_status" ON "residents" ("status");

CREATE INDEX "residents_role" ON "residents" ("role");

CREATE UNIQUE INDEX "residents_society_id_mobile" ON "residents" ("society_id", "mobile");

