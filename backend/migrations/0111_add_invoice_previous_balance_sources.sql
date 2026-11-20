-- Audit links only: source invoice balances remain the authoritative payables.
-- The application must validate matching Society and Unit IDs before insert.
CREATE TABLE "invoice_previous_balance_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "statement_invoice_id" UUID NOT NULL,
    "source_invoice_id" UUID NOT NULL,
    "amount_at_statement" NUMERIC(15, 2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "invoice_previous_balance_sources_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoice_previous_balance_sources_statement_fk"
        FOREIGN KEY ("statement_invoice_id")
        REFERENCES "invoices" ("id") ON DELETE RESTRICT,
    CONSTRAINT "invoice_previous_balance_sources_source_fk"
        FOREIGN KEY ("source_invoice_id")
        REFERENCES "invoices" ("id") ON DELETE RESTRICT,
    CONSTRAINT "invoice_previous_balance_sources_distinct_invoices"
        CHECK ("statement_invoice_id" <> "source_invoice_id"),
    CONSTRAINT "invoice_previous_balance_sources_positive_amount"
        CHECK ("amount_at_statement" > 0),
    CONSTRAINT "invoice_previous_balance_sources_pair_unique"
        UNIQUE ("statement_invoice_id", "source_invoice_id")
);

CREATE INDEX "invoice_previous_balance_sources_source_invoice_idx"
    ON "invoice_previous_balance_sources" ("source_invoice_id");
