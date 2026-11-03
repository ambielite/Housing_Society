-- Keep resident app accounts from creating societies, including databases
-- where migration 047 was already applied before its seed was corrected.
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.society_id IS NULL
  AND r.code = 'RESIDENT_APP'
  AND p.code = 'SOCIETY_CREATE';
