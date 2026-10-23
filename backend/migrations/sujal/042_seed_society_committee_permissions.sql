INSERT INTO permissions (code, name, module, action, description) VALUES
  ('SOCIETY_COMMITTEE_CREATE', 'Add committee member', 'SOCIETY_COMMITTEE', 'CREATE', 'Add a society management committee member'),
  ('SOCIETY_COMMITTEE_READ', 'View management committee', 'SOCIETY_COMMITTEE', 'READ', 'View society management committee members'),
  ('SOCIETY_COMMITTEE_UPDATE', 'Update committee member', 'SOCIETY_COMMITTEE', 'UPDATE', 'Update society committee member details'),
  ('SOCIETY_COMMITTEE_DELETE', 'Remove committee member', 'SOCIETY_COMMITTEE', 'DELETE', 'Remove a society committee member')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'SOCIETY_ADMIN')
  AND r.society_id IS NULL
  AND p.module = 'SOCIETY_COMMITTEE'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('SECURITY_HEAD', 'FACILITY_MANAGER', 'PRESIDENT_SECRETARY', 'AUDITOR', 'VIEW_ONLY')
  AND r.society_id IS NULL
  AND p.module = 'SOCIETY_COMMITTEE'
  AND p.action = 'READ'
ON CONFLICT DO NOTHING;
