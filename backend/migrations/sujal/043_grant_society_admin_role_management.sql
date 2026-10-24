-- Allow society administrators to create custom roles and configure their
-- permissions within their own society scope.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SOCIETY_ADMIN'
  AND r.society_id IS NULL
  AND p.code IN ('ROLE_CREATE', 'ROLE_PERMISSION_ASSIGN')
ON CONFLICT DO NOTHING;
