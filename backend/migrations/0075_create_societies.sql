-- PostgreSQL 13+. Table: societies

-- Includes this table's enum types, columns and indexes.

-- societies
CREATE TABLE "societies" ("id" UUID  DEFAULT gen_random_uuid(), "name" VARCHAR(255) NOT NULL, "rera_number" VARCHAR(100), "pan" VARCHAR(20), "gstin" VARCHAR(20), "address" TEXT NOT NULL, "structural_area" DECIMAL, "currency" VARCHAR(10) DEFAULT 'INR', "timezone" VARCHAR(100) DEFAULT 'Asia/Kolkata', "tax_configuration" JSONB, "organization_id" UUID, "cluster_id" UUID, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));

