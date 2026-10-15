-- PostgreSQL 13+. Table: taxes

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_taxes_tax_type" AS ENUM ('GST', 'CGST', 'SGST', 'IGST', 'TDS', 'OTHER');

CREATE TYPE "public"."enum_taxes_calculation_method" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TYPE "public"."enum_taxes_applicable_on" AS ENUM ('INVOICE', 'BILLING', 'PAYMENT', 'VENDOR_PAYMENT', 'OTHER');

-- taxes
CREATE TABLE "taxes" ("id" UUID  DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "tax_code" VARCHAR(50) NOT NULL, "tax_name" VARCHAR(150) NOT NULL, "tax_type" "public"."enum_taxes_tax_type" NOT NULL, "tax_rate" DECIMAL(8,4) NOT NULL, "calculation_method" "public"."enum_taxes_calculation_method" NOT NULL DEFAULT 'PERCENTAGE', "fixed_amount" DECIMAL(14,2), "component_group" VARCHAR(50), "applicable_on" "public"."enum_taxes_applicable_on" NOT NULL DEFAULT 'INVOICE', "registration_number" VARCHAR(100), "effective_from" DATE NOT NULL, "effective_to" DATE, "is_active" BOOLEAN NOT NULL DEFAULT true, "description" TEXT, "remarks" TEXT, "metadata" JSONB, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "taxes_society_id_tax_code" ON "taxes" ("society_id", "tax_code");

CREATE INDEX "taxes_tax_type" ON "taxes" ("tax_type");

CREATE INDEX "taxes_is_active" ON "taxes" ("is_active");

CREATE INDEX "taxes_effective_from" ON "taxes" ("effective_from");

