-- PostgreSQL 13+. Table: stock_transactions

-- Includes this table's enum types, columns and indexes.

CREATE TYPE "public"."enum_stock_transactions_transaction_type" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'TRANSFER', 'ADJUSTMENT', 'RETURN');

-- stock_transactions
CREATE TABLE "stock_transactions" ("id" UUID  DEFAULT gen_random_uuid(), "transaction_number" VARCHAR(100) NOT NULL UNIQUE, "inventory_id" UUID NOT NULL, "transaction_type" "public"."enum_stock_transactions_transaction_type" NOT NULL, "quantity" DECIMAL(14,3) NOT NULL, "previous_stock" DECIMAL(14,3) NOT NULL, "new_stock" DECIMAL(14,3) NOT NULL, "source_inventory_id" UUID, "destination_inventory_id" UUID, "reference_number" VARCHAR(150), "reference_type" VARCHAR(100), "reason" TEXT, "transaction_date" TIMESTAMP WITH TIME ZONE NOT NULL, "performed_by" VARCHAR(150), "remarks" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

CREATE INDEX "stock_transactions_inventory_id" ON "stock_transactions" ("inventory_id")

CREATE INDEX "stock_transactions_transaction_type" ON "stock_transactions" ("transaction_type")

CREATE INDEX "stock_transactions_transaction_date" ON "stock_transactions" ("transaction_date")

CREATE INDEX "stock_transactions_source_inventory_id" ON "stock_transactions" ("source_inventory_id")

CREATE INDEX "stock_transactions_destination_inventory_id" ON "stock_transactions" ("destination_inventory_id")

CREATE INDEX "stock_transactions_reference_number" ON "stock_transactions" ("reference_number")

