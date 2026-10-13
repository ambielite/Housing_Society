-- PostgreSQL 13+. Table: patrol_checkpoints

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_patrol_checkpoints_status" AS ENUM ('PENDING', 'VERIFIED', 'MISSED');

CREATE TYPE "public"."enum_patrol_checkpoints_verification_method" AS ENUM ('QR', 'NFC', 'GPS', 'QR_NFC', 'QR_GPS', 'NFC_GPS', 'QR_NFC_GPS');

-- patrol_checkpoints
CREATE TABLE "patrol_checkpoints" ("id" UUID  DEFAULT gen_random_uuid(), "patrol_id" UUID NOT NULL, "checkpoint_id" UUID NOT NULL, "sequence_order" INTEGER NOT NULL, "status" "public"."enum_patrol_checkpoints_status" NOT NULL DEFAULT 'PENDING', "verification_method" "public"."enum_patrol_checkpoints_verification_method", "verified_at" TIMESTAMP WITH TIME ZONE, "verified_latitude" DECIMAL(10,7), "verified_longitude" DECIMAL(10,7), "verification_reference" VARCHAR(255), "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "patrol_checkpoints_patrol_id_checkpoint_id" ON "patrol_checkpoints" ("patrol_id", "checkpoint_id")

CREATE INDEX "patrol_checkpoints_patrol_id" ON "patrol_checkpoints" ("patrol_id")

CREATE INDEX "patrol_checkpoints_checkpoint_id" ON "patrol_checkpoints" ("checkpoint_id")

CREATE INDEX "patrol_checkpoints_status" ON "patrol_checkpoints" ("status")

