-- =====================================================================
-- Migration 002: Seed permission catalog + system role templates
-- (Spec doc Appendix / Section 31 "Seed / Reference Data")
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('USER_CREATE',            'Create user',                 'USER',    'CREATE', 'Create a new admin-panel user'),
  ('USER_READ',              'View users',                  'USER',    'READ',   'View user records and login history'),
  ('USER_UPDATE',            'Update user',                 'USER',    'UPDATE', 'Update a user profile or status'),
  ('USER_DELETE',            'Archive user',                'USER',    'DELETE', 'Archive/soft-delete a user'),
  ('USER_FORCE_LOGOUT',      'Force logout user',            'USER',    'UPDATE', 'Revoke all active sessions for a user'),
  ('ROLE_CREATE',            'Create role',                  'RBAC',    'CREATE', 'Create a new role'),
  ('ROLE_READ',              'View roles',                   'RBAC',    'READ',   'View roles and role assignments'),
  ('ROLE_UPDATE',            'Update role',                  'RBAC',    'UPDATE', 'Update a role'),
  ('ROLE_DELETE',            'Delete role',                  'RBAC',    'DELETE', 'Delete a non-system role'),
  ('PERMISSION_READ',        'View permissions',             'RBAC',    'READ',   'View the permission catalog'),
  ('ROLE_PERMISSION_ASSIGN', 'Assign permission to role',    'RBAC',    'ASSIGN', 'Attach/detach permissions on a role'),
  ('USER_ROLE_ASSIGN',       'Assign role to user',          'RBAC',    'ASSIGN', 'Attach/detach a role on a user'),
  ('SOCIETY_READ',           'View society',                 'SOCIETY', 'READ',   'View society profile'),
  ('SOCIETY_UPDATE',         'Update society',               'SOCIETY', 'UPDATE', 'Update society profile')
ON CONFLICT (code) DO NOTHING;

-- System (global, society_id IS NULL) role templates
INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Super Admin', 'SUPER_ADMIN', 'Full platform access across all societies', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Society Admin', 'SOCIETY_ADMIN', 'Day-to-day administration for one society', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'View Only Admin', 'VIEW_ONLY', 'Read-only operational visibility', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

-- SUPER_ADMIN: granted every permission for completeness/visibility.
-- (authMiddleware also hard-bypasses permission checks for this role code.)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: user + RBAC administration for their own society
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL
  AND p.code IN (
    'USER_CREATE','USER_READ','USER_UPDATE','USER_DELETE','USER_FORCE_LOGOUT',
    'ROLE_READ','PERMISSION_READ','USER_ROLE_ASSIGN',
    'SOCIETY_READ','SOCIETY_UPDATE'
  )
ON CONFLICT DO NOTHING;

-- VIEW_ONLY: every READ permission, nothing else
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VIEW_ONLY' AND r.society_id IS NULL AND p.action = 'READ'
ON CONFLICT DO NOTHING;
