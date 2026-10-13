-- PostgreSQL 13+. Table: staff_tasks

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_staff_tasks_task_type" AS ENUM ('SECURITY', 'HOUSEKEEPING', 'MAINTENANCE', 'INSPECTION', 'PATROL', 'EMERGENCY', 'OTHER');

CREATE TYPE "public"."enum_staff_tasks_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TYPE "public"."enum_staff_tasks_status" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- staff_tasks
CREATE TABLE "staff_tasks" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "staff_id" UUID NOT NULL, "assigned_by" UUID, "title" VARCHAR(200) NOT NULL, "description" TEXT, "task_type" "public"."enum_staff_tasks_task_type" NOT NULL DEFAULT 'OTHER', "priority" "public"."enum_staff_tasks_priority" NOT NULL DEFAULT 'MEDIUM', "due_date" TIMESTAMP WITH TIME ZONE, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "status" "public"."enum_staff_tasks_status" NOT NULL DEFAULT 'ASSIGNED', "completion_remarks" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "staff_tasks_society_id" ON "staff_tasks" ("society_id")

CREATE INDEX "staff_tasks_staff_id" ON "staff_tasks" ("staff_id")

CREATE INDEX "staff_tasks_status" ON "staff_tasks" ("status")

CREATE INDEX "staff_tasks_priority" ON "staff_tasks" ("priority")

CREATE INDEX "staff_tasks_task_type" ON "staff_tasks" ("task_type")

CREATE INDEX "staff_tasks_due_date" ON "staff_tasks" ("due_date")

