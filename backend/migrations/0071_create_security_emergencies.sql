-- PostgreSQL 13+. Table: security_emergencies

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_security_emergencies_emergency_type" AS ENUM ('FIRE', 'MEDICAL', 'SECURITY_BREACH', 'THEFT', 'ACCIDENT', 'ELECTRICAL', 'WATER_LEAKAGE', 'FLOOD', 'GAS_LEAK', 'MISSING_PERSON', 'NATURAL_DISASTER', 'VIOLENCE', 'OTHER');

CREATE TYPE "public"."enum_security_emergencies_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_security_emergencies_status" AS ENUM ('TRIGGERED', 'ACKNOWLEDGED', 'RESPONDING', 'RESOLVED', 'CLOSED', 'CANCELLED', 'FALSE_ALARM');

-- security_emergencies
CREATE TABLE "security_emergencies" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "emergency_number" VARCHAR(50) NOT NULL, "emergency_type" "public"."enum_security_emergencies_emergency_type" NOT NULL, "priority" "public"."enum_security_emergencies_priority" NOT NULL DEFAULT 'HIGH', "title" VARCHAR(255) NOT NULL, "description" TEXT NOT NULL, "reported_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reported_by" UUID, "reported_by_name" VARCHAR(255), "reported_by_mobile" VARCHAR(20), "unit_id" UUID, "location" VARCHAR(255), "latitude" DECIMAL(10,7), "longitude" DECIMAL(10,7), "assigned_to" UUID, "status" "public"."enum_security_emergencies_status" NOT NULL DEFAULT 'TRIGGERED', "acknowledged_at" TIMESTAMP WITH TIME ZONE, "response_started_at" TIMESTAMP WITH TIME ZONE, "resolved_at" TIMESTAMP WITH TIME ZONE, "closed_at" TIMESTAMP WITH TIME ZONE, "response_notes" TEXT, "resolution_details" TEXT, "external_reference" VARCHAR(100), "police_contacted" BOOLEAN NOT NULL DEFAULT false, "ambulance_contacted" BOOLEAN NOT NULL DEFAULT false, "fire_brigade_contacted" BOOLEAN NOT NULL DEFAULT false, "emergency_contacted" BOOLEAN NOT NULL DEFAULT false, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "security_emergencies_society_id_emergency_number" ON "security_emergencies" ("society_id", "emergency_number")

CREATE INDEX "security_emergencies_society_id" ON "security_emergencies" ("society_id")

CREATE INDEX "security_emergencies_emergency_type" ON "security_emergencies" ("emergency_type")

CREATE INDEX "security_emergencies_priority" ON "security_emergencies" ("priority")

CREATE INDEX "security_emergencies_status" ON "security_emergencies" ("status")

CREATE INDEX "security_emergencies_reported_at" ON "security_emergencies" ("reported_at")

CREATE INDEX "security_emergencies_assigned_to" ON "security_emergencies" ("assigned_to")

CREATE INDEX "security_emergencies_unit_id" ON "security_emergencies" ("unit_id")

