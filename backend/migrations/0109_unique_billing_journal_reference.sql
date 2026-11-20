-- A Billing may have at most one Journal entry. Existing duplicates were
-- checked in housing_society_test before this migration was prepared.
CREATE UNIQUE INDEX "journals_billing_reference_unique"
    ON "journals" ("society_id", "reference_id")
    WHERE "reference_type" = 'BILLING'
      AND "reference_id" IS NOT NULL;
