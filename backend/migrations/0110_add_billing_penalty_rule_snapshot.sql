-- Nullable and additive: existing rows remain unchanged and resolve a legacy
-- penalty rule as of their bill date. New bills store the applicable rule JSON.
ALTER TABLE "billings"
    ADD COLUMN IF NOT EXISTS "penalty_rule_snapshot" JSONB;

-- Rollback, only if this migration must be reverted before snapshots are needed:
-- ALTER TABLE "billings" DROP COLUMN IF EXISTS "penalty_rule_snapshot";
