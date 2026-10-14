-- =====================================================================
-- Migration 015: Link users to vendors (closes the "Vendor portal
-- access restricted to assigned scope" gap - spec Section 15).
-- Not in the original DB doc's Section 11 table list; added to make
-- the VENDOR role's row-level restriction actually enforceable.
-- =====================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- One login maps to at most one vendor record.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors (user_id) WHERE user_id IS NOT NULL;
