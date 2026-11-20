-- A Billing record can back at most one resident Invoice.
-- The partial index preserves standalone invoices with a NULL billing_id.
CREATE UNIQUE INDEX "invoices_billing_id_unique"
    ON "invoices" ("billing_id")
    WHERE "billing_id" IS NOT NULL;
