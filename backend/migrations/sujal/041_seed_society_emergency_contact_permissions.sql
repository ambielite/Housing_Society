INSERT INTO permissions (code, name, module, action, description) VALUES
  ('SOCIETY_EMERGENCY_CONTACT_CREATE', 'Add emergency contact', 'SOCIETY_EMERGENCY_CONTACT', 'CREATE', 'Add a society emergency service contact'),
  ('SOCIETY_EMERGENCY_CONTACT_READ', 'View emergency contacts', 'SOCIETY_EMERGENCY_CONTACT', 'READ', 'View society emergency service contacts'),
  ('SOCIETY_EMERGENCY_CONTACT_UPDATE', 'Update emergency contact', 'SOCIETY_EMERGENCY_CONTACT', 'UPDATE', 'Update society emergency service contact details'),
  ('SOCIETY_EMERGENCY_CONTACT_DELETE', 'Remove emergency contact', 'SOCIETY_EMERGENCY_CONTACT', 'DELETE', 'Remove a society emergency service contact')
ON CONFLICT (code) DO NOTHING;

-- Society administrators can maintain the directory.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'SOCIETY_ADMIN')
  AND r.society_id IS NULL
  AND p.module = 'SOCIETY_EMERGENCY_CONTACT'
ON CONFLICT DO NOTHING;

-- Operations and read-only personas can consult the directory.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('SECURITY_HEAD', 'FACILITY_MANAGER', 'PRESIDENT_SECRETARY', 'AUDITOR', 'VIEW_ONLY')
  AND r.society_id IS NULL
  AND p.module = 'SOCIETY_EMERGENCY_CONTACT'
  AND p.action = 'READ'
ON CONFLICT DO NOTHING;
