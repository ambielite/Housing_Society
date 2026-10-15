-- PostgreSQL 13+. Table: community_meeting_attendance

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_community_meeting_attendance_attendance_status" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- community_meeting_attendance
CREATE TABLE "community_meeting_attendance" ("id" UUID  DEFAULT gen_random_uuid(), "meeting_id" UUID NOT NULL, "user_id" UUID NOT NULL, "attendance_status" "public"."enum_community_meeting_attendance_attendance_status" NOT NULL DEFAULT 'PRESENT', "check_in_at" TIMESTAMP WITH TIME ZONE, "check_out_at" TIMESTAMP WITH TIME ZONE, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "community_meeting_attendance_meeting_id" ON "community_meeting_attendance" ("meeting_id");

CREATE INDEX "community_meeting_attendance_user_id" ON "community_meeting_attendance" ("user_id");

CREATE INDEX "community_meeting_attendance_attendance_status" ON "community_meeting_attendance" ("attendance_status");

CREATE UNIQUE INDEX "community_meeting_attendance_meeting_id_user_id" ON "community_meeting_attendance" ("meeting_id", "user_id");

