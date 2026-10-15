-- =====================================================================
-- Migration 032: Utility/Meter permissions
-- No new roles needed - all relevant personas already exist.
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('UTILITY_TYPE_CREATE',    'Create utility type',      'UTILITY', 'CREATE', 'Create a utility type (electricity/water/gas/EV)'),
  ('UTILITY_TYPE_READ',      'View utility types',       'UTILITY', 'READ',   'View utility types'),
  ('UTILITY_TYPE_UPDATE',    'Update utility type',      'UTILITY', 'UPDATE', 'Update a utility type'),
  ('UTILITY_TYPE_DELETE',    'Delete utility type',      'UTILITY', 'DELETE', 'Delete a utility type'),
  ('METER_CREATE',           'Create meter',              'UTILITY', 'CREATE', 'Register a meter'),
  ('METER_READ',             'View meters',               'UTILITY', 'READ',   'View meters'),
  ('METER_UPDATE',           'Update meter',              'UTILITY', 'UPDATE', 'Update/replace/decommission a meter'),
  ('METER_DELETE',           'Delete meter',              'UTILITY', 'DELETE', 'Delete a meter'),
  ('METER_READING_CREATE',   'Submit meter reading',      'UTILITY', 'CREATE', 'Submit a manual/bulk/estimated meter reading'),
  ('METER_READING_READ',     'View meter readings',       'UTILITY', 'READ',   'View meter reading history'),
  ('METER_READING_UPDATE',   'Validate/reject reading',   'UTILITY', 'UPDATE', 'Validate, reject, or adjust a meter reading'),
  ('UTILITY_TARIFF_CREATE',  'Create utility tariff',     'UTILITY', 'CREATE', 'Create a utility tariff/slab config'),
  ('UTILITY_TARIFF_READ',    'View utility tariffs',      'UTILITY', 'READ',   'View utility tariffs'),
  ('UTILITY_TARIFF_UPDATE',  'Update utility tariff',     'UTILITY', 'UPDATE', 'Update a utility tariff'),
  ('UTILITY_TARIFF_DELETE',  'Delete utility tariff',     'UTILITY', 'DELETE', 'Delete a utility tariff'),
  ('UTILITY_BILL_CREATE',    'Create utility bill',       'UTILITY', 'CREATE', 'Calculate a utility bill from a validated reading'),
  ('UTILITY_BILL_READ',      'View utility bills',        'UTILITY', 'READ',   'View utility bills'),
  ('UTILITY_BILL_UPDATE',    'Update utility bill',       'UTILITY', 'UPDATE', 'Update/mark-invoiced a utility bill')
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN: every new permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL AND p.module = 'UTILITY'
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL AND p.module = 'UTILITY'
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER: full access (meters/utilities are facility operations)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL AND p.module = 'UTILITY'
ON CONFLICT DO NOTHING;

-- ACCOUNTANT: full read + bill create/update (billing-adjacent - matches
-- persona table's "Billing, receipts, ledger, reconciliation, taxes")
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ACCOUNTANT' AND r.society_id IS NULL
  AND (p.action = 'READ' OR p.code IN ('UTILITY_BILL_CREATE', 'UTILITY_BILL_UPDATE'))
  AND p.module = 'UTILITY'
ON CONFLICT DO NOTHING;

-- PRESIDENT_SECRETARY, TREASURER, AUDITOR, VIEW_ONLY: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('PRESIDENT_SECRETARY', 'TREASURER', 'AUDITOR', 'VIEW_ONLY') AND r.society_id IS NULL
  AND p.module = 'UTILITY' AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- SECURITY_HEAD, VENDOR, HELPDESK_MANAGER: intentionally no grants - outside their scope.
