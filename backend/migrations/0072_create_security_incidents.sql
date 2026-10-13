-- PostgreSQL 13+. Table: security_incidents

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_security_incidents_incident_type" AS ENUM ('SECURITY_BREACH', 'THEFT', 'FIRE', 'MEDICAL', 'ACCIDENT', 'FIGHT', 'VANDALISM', 'UNAUTHORIZED_ACCESS', 'VEHICLE', 'PROPERTY_DAMAGE', 'SAFETY_HAZARD', 'OTHER');

CREATE TYPE "public"."enum_security_incidents_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_security_incidents_status" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'REJECTED');

CREATE TYPE "public"."enum_security_incidents_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- security_incidents
CREATE TABLE "security_incidents" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "incident_number" VARCHAR(50) NOT NULL, "incident_type" "public"."enum_security_incidents_incident_type" NOT NULL, "severity" "public"."enum_security_incidents_severity" NOT NULL DEFAULT 'MEDIUM', "title" VARCHAR(255) NOT NULL, "description" TEXT NOT NULL, "incident_date" TIMESTAMP WITH TIME ZONE NOT NULL, "reported_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reported_by" UUID, "reported_by_name" VARCHAR(255), "reported_by_mobile" VARCHAR(20), "unit_id" UUID, "location" VARCHAR(255), "assigned_to" UUID, "status" "public"."enum_security_incidents_status" NOT NULL DEFAULT 'REPORTED', "priority" "public"."enum_security_incidents_priority" NOT NULL DEFAULT 'MEDIUM', "investigation_notes" TEXT, "resolution_details" TEXT, "resolved_at" TIMESTAMP WITH TIME ZONE, "closed_at" TIMESTAMP WITH TIME ZONE, "evidence_description" TEXT, "police_complaint_number" VARCHAR(100), "police_complaint_date" DATE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "security_incidents_society_id_incident_number" ON "security_incidents" ("society_id", "incident_number")

CREATE INDEX "security_incidents_society_id" ON "security_incidents" ("society_id")

CREATE INDEX "security_incidents_incident_type" ON "security_incidents" ("incident_type")

CREATE INDEX "security_incidents_severity" ON "security_incidents" ("severity")

CREATE INDEX "security_incidents_status" ON "security_incidents" ("status")

CREATE INDEX "security_incidents_incident_date" ON "security_incidents" ("incident_date")

CREATE INDEX "security_incidents_assigned_to" ON "security_incidents" ("assigned_to")

CREATE INDEX "security_incidents_unit_id" ON "security_incidents" ("unit_id")

