-- PostgreSQL 13+. Table: security_audits

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_security_audits_user_type" AS ENUM ('ADMIN', 'SECURITY_STAFF', 'SUPERVISOR', 'RESIDENT', 'SYSTEM', 'OTHER');

CREATE TYPE "public"."enum_security_audits_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'ASSIGN', 'UNASSIGN', 'START', 'COMPLETE', 'CANCEL', 'VERIFY', 'ACKNOWLEDGE', 'RESOLVE', 'CLOSE', 'TRIGGER', 'OTHER');

CREATE TYPE "public"."enum_security_audits_module" AS ENUM ('STAFF', 'STAFF_DOCUMENT', 'STAFF_UNIT_MAPPING', 'STAFF_ATTENDANCE', 'SHIFT', 'ROSTER', 'STAFF_TASK', 'CHECKPOINT', 'PATROL', 'INCIDENT', 'EMERGENCY', 'SECURITY_AUDIT', 'OTHER');

CREATE TYPE "public"."enum_security_audits_severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- security_audits
CREATE TABLE "security_audits" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "user_id" UUID, "user_type" "public"."enum_security_audits_user_type" NOT NULL DEFAULT 'SYSTEM', "user_name" VARCHAR(255), "action" "public"."enum_security_audits_action" NOT NULL, "module" "public"."enum_security_audits_module" NOT NULL, "entity_id" UUID, "entity_type" VARCHAR(100), "description" TEXT, "old_values" JSONB, "new_values" JSONB, "ip_address" VARCHAR(100), "user_agent" TEXT, "device_info" VARCHAR(255), "request_id" VARCHAR(100), "severity" "public"."enum_security_audits_severity" NOT NULL DEFAULT 'INFO', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "security_audits_society_id" ON "security_audits" ("society_id");

CREATE INDEX "security_audits_user_id" ON "security_audits" ("user_id");

CREATE INDEX "security_audits_action" ON "security_audits" ("action");

CREATE INDEX "security_audits_module" ON "security_audits" ("module");

CREATE INDEX "security_audits_entity_id" ON "security_audits" ("entity_id");

CREATE INDEX "security_audits_created_at" ON "security_audits" ("created_at");

CREATE INDEX "security_audits_severity" ON "security_audits" ("severity");

