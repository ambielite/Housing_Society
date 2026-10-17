-- Grant document listing and metadata read access to active society roles.
-- Society context and confidential-document checks remain enforced by the API.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.status = 'ACTIVE'
  AND p.code = 'DOCUMENT_READ'
ON CONFLICT DO NOTHING;
