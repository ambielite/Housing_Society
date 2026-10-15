-- PostgreSQL 13+. Table: work_orders

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_work_orders_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."enum_work_orders_status" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- work_orders
CREATE TABLE "work_orders" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "work_order_number" VARCHAR(100) NOT NULL, "schedule_id" UUID, "asset_id" UUID NOT NULL, "amc_id" UUID, "vendor_id" UUID, "title" VARCHAR(255) NOT NULL, "description" TEXT, "priority" "public"."enum_work_orders_priority" NOT NULL DEFAULT 'MEDIUM', "status" "public"."enum_work_orders_status" NOT NULL DEFAULT 'OPEN', "scheduled_date" DATE NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "assigned_to" VARCHAR(150), "estimated_cost" DECIMAL(14,2), "actual_cost" DECIMAL(14,2), "completion_notes" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "work_orders_society_id_work_order_number" ON "work_orders" ("society_id", "work_order_number");

CREATE INDEX "work_orders_society_id" ON "work_orders" ("society_id");

CREATE INDEX "work_orders_schedule_id" ON "work_orders" ("schedule_id");

CREATE INDEX "work_orders_asset_id" ON "work_orders" ("asset_id");

CREATE INDEX "work_orders_amc_id" ON "work_orders" ("amc_id");

CREATE INDEX "work_orders_vendor_id" ON "work_orders" ("vendor_id");

CREATE INDEX "work_orders_scheduled_date" ON "work_orders" ("scheduled_date");

CREATE INDEX "work_orders_status" ON "work_orders" ("status");

CREATE INDEX "work_orders_priority" ON "work_orders" ("priority");

