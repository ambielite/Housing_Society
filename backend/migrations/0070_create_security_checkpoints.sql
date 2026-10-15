-- PostgreSQL 13+. Table: security_checkpoints

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_security_checkpoints_verification_method" AS ENUM ('QR', 'NFC', 'GPS', 'QR_NFC', 'QR_GPS', 'NFC_GPS', 'QR_NFC_GPS');

CREATE TYPE "public"."enum_security_checkpoints_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- security_checkpoints
CREATE TABLE "security_checkpoints" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "checkpoint_code" VARCHAR(50) NOT NULL, "checkpoint_name" VARCHAR(150) NOT NULL, "location_name" VARCHAR(255) NOT NULL, "description" TEXT, "verification_method" "public"."enum_security_checkpoints_verification_method" NOT NULL DEFAULT 'QR', "latitude" DECIMAL(10,7), "longitude" DECIMAL(10,7), "gps_radius_meters" INTEGER, "qr_code" VARCHAR(255) UNIQUE, "nfc_tag" VARCHAR(255) UNIQUE, "sequence_order" INTEGER NOT NULL DEFAULT 1, "status" "public"."enum_security_checkpoints_status" NOT NULL DEFAULT 'ACTIVE', "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "security_checkpoints_society_id_checkpoint_code" ON "security_checkpoints" ("society_id", "checkpoint_code");

CREATE INDEX "security_checkpoints_society_id" ON "security_checkpoints" ("society_id");

CREATE INDEX "security_checkpoints_status" ON "security_checkpoints" ("status");

CREATE INDEX "security_checkpoints_sequence_order" ON "security_checkpoints" ("sequence_order");

