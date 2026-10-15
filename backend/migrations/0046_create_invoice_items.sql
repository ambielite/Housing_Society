-- PostgreSQL 13+. Table: invoice_items

-- Includes this table's enum types, columns and indexes.

-- invoice_items
CREATE TABLE "invoice_items" ("id" UUID  DEFAULT gen_random_uuid(), "invoice_id" UUID NOT NULL, "billing_config_id" UUID, "description" VARCHAR(255) NOT NULL, "quantity" DECIMAL(15,4) NOT NULL DEFAULT 1, "rate" DECIMAL(15,4) NOT NULL DEFAULT 0, "amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0, "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "invoice_items_invoice_id" ON "invoice_items" ("invoice_id");

CREATE INDEX "invoice_items_billing_config_id" ON "invoice_items" ("billing_config_id");

