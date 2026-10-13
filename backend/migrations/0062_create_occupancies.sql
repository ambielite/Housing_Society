-- PostgreSQL 13+. Table: occupancies

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_occupancies_occupancy_type" AS ENUM ('OWNER', 'TENANT');

-- occupancies
CREATE TABLE "occupancies" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID NOT NULL, "resident_id" UUID NOT NULL, "occupancy_type" "public"."enum_occupancies_occupancy_type" NOT NULL, "start_date" DATE NOT NULL, "end_date" DATE, "billing_start_date" DATE, "billing_end_date" DATE, "is_current" BOOLEAN DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

