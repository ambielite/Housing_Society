-- PostgreSQL 13+. Table: billing_configs

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_billing_configs_config_type" AS ENUM ('CHARGE_HEAD', 'BILLING_RULE', 'BILLING_CYCLE', 'PENALTY_RULE');

CREATE TYPE "public"."enum_billing_configs_charge_category" AS ENUM ('MAINTENANCE', 'PARKING', 'AMENITY', 'UTILITY', 'OTHER');

CREATE TYPE "public"."enum_billing_configs_billing_model" AS ENUM ('FLAT_RATE', 'AREA_BASED', 'HYBRID');

CREATE TYPE "public"."enum_billing_configs_billing_frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM');

CREATE TYPE "public"."enum_billing_configs_penalty_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'DAILY_FIXED', 'DAILY_PERCENTAGE');

-- billing_configs
CREATE TABLE "billing_configs" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "config_type" "public"."enum_billing_configs_config_type" NOT NULL, "code" VARCHAR(100) NOT NULL, "name" VARCHAR(255) NOT NULL, "charge_category" "public"."enum_billing_configs_charge_category", "billing_model" "public"."enum_billing_configs_billing_model", "flat_amount" DECIMAL(15,2), "rate_per_area" DECIMAL(15,4), "fixed_amount" DECIMAL(15,2), "billing_frequency" "public"."enum_billing_configs_billing_frequency", "billing_day" INTEGER, "due_days" INTEGER, "penalty_type" "public"."enum_billing_configs_penalty_type", "penalty_value" DECIMAL(15,4), "grace_period_days" INTEGER DEFAULT 0, "effective_from" DATE NOT NULL, "effective_to" DATE, "is_taxable" BOOLEAN DEFAULT false, "tax_rate" DECIMAL(5,2) DEFAULT 0, "is_active" BOOLEAN DEFAULT true, "description" TEXT, "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "billing_configs_society_id_config_type_code" ON "billing_configs" ("society_id", "config_type", "code")

CREATE INDEX "billing_configs_society_id_config_type" ON "billing_configs" ("society_id", "config_type")

CREATE INDEX "billing_configs_effective_from_effective_to" ON "billing_configs" ("effective_from", "effective_to")

