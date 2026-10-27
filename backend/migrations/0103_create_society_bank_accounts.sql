CREATE TABLE IF NOT EXISTS society_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  bank_name VARCHAR(150) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(34) NOT NULL,
  account_type VARCHAR(20) NOT NULL DEFAULT 'CURRENT'
    CHECK (account_type IN ('SAVINGS', 'CURRENT', 'CASH_CREDIT', 'OVERDRAFT')),
  ifsc VARCHAR(20) NOT NULL,
  branch_name VARCHAR(150),
  upi_id VARCHAR(150),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_society_bank_accounts_society
  ON society_bank_accounts (society_id, is_active, bank_name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_society_bank_accounts_primary
  ON society_bank_accounts (society_id)
  WHERE is_primary = TRUE AND is_active = TRUE;

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('SOCIETY_BANK_ACCOUNT_CREATE', 'Add society bank account', 'SOCIETY_BANK_ACCOUNT', 'CREATE', 'Add society-owned bank account details'),
  ('SOCIETY_BANK_ACCOUNT_READ', 'View society bank accounts', 'SOCIETY_BANK_ACCOUNT', 'READ', 'View masked society bank account details'),
  ('SOCIETY_BANK_ACCOUNT_UPDATE', 'Update society bank accounts', 'SOCIETY_BANK_ACCOUNT', 'UPDATE', 'Update or select primary society bank accounts'),
  ('SOCIETY_BANK_ACCOUNT_DELETE', 'Deactivate society bank accounts', 'SOCIETY_BANK_ACCOUNT', 'DELETE', 'Deactivate society bank accounts')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.society_id IS NULL
  AND r.code IN ('SUPER_ADMIN', 'SOCIETY_ADMIN')
  AND p.module = 'SOCIETY_BANK_ACCOUNT'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.society_id IS NULL
  AND r.code = 'TREASURER'
  AND p.module = 'SOCIETY_BANK_ACCOUNT'
  AND p.action IN ('CREATE', 'READ', 'UPDATE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.society_id IS NULL
  AND r.code IN ('ACCOUNTANT', 'PRESIDENT_SECRETARY', 'AUDITOR', 'VIEW_ONLY')
  AND p.module = 'SOCIETY_BANK_ACCOUNT'
  AND p.action = 'READ'
ON CONFLICT DO NOTHING;
