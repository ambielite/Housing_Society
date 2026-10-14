-- Migration 034: support multiple existing user logins for one vendor.
-- Keep vendors.user_id as a compatibility pointer for older code and data.
CREATE TABLE IF NOT EXISTS vendor_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_vendor_users_vendor_user UNIQUE (vendor_id, user_id),
  CONSTRAINT uq_vendor_users_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_users_vendor ON vendor_users(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_users_user ON vendor_users(user_id);

-- Preserve every existing single-user link before new links are created.
INSERT INTO vendor_users (vendor_id, user_id)
SELECT v.id, v.user_id
FROM vendors v
WHERE v.user_id IS NOT NULL
ON CONFLICT (vendor_id, user_id) DO NOTHING;
