-- =====================================================================
-- Migration 029: Document Vault permissions
-- No new roles needed - all relevant personas already exist.
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('DOCUMENT_FOLDER_CREATE',   'Create document folder',   'DOCUMENT_FOLDER', 'CREATE', 'Create a document folder'),
  ('DOCUMENT_FOLDER_READ',     'View document folders',    'DOCUMENT_FOLDER', 'READ',   'View document folders'),
  ('DOCUMENT_FOLDER_UPDATE',   'Update document folder',   'DOCUMENT_FOLDER', 'UPDATE', 'Update a document folder'),
  ('DOCUMENT_FOLDER_DELETE',   'Delete document folder',   'DOCUMENT_FOLDER', 'DELETE', 'Delete a document folder'),
  ('DOCUMENT_CREATE',          'Upload document',          'DOCUMENT',        'CREATE', 'Upload a new document'),
  ('DOCUMENT_READ',            'View document metadata',   'DOCUMENT',        'READ',   'View document metadata/listing'),
  ('DOCUMENT_UPDATE',          'Update document metadata', 'DOCUMENT',        'UPDATE', 'Update document metadata'),
  ('DOCUMENT_DELETE',          'Delete document',          'DOCUMENT',        'DELETE', 'Delete a document'),
  ('DOCUMENT_DOWNLOAD',        'Download document file',   'DOCUMENT',        'READ',   'Download the actual document file'),
  ('DOCUMENT_VERSION_CREATE',  'Upload document version',  'DOCUMENT',        'CREATE', 'Upload a new version of a document'),
  ('DOCUMENT_VERSION_READ',    'View document versions',   'DOCUMENT',        'READ',   'View document version history'),
  ('DOCUMENT_PERMISSION_MANAGE','Manage document permission','DOCUMENT',      'UPDATE', 'Grant/revoke per-document access'),
  ('DOCUMENT_PERMISSION_READ', 'View document permissions', 'DOCUMENT',       'READ',   'View per-document access grants'),
  ('DOCUMENT_LINK_CREATE',     'Link document to entity',  'DOCUMENT',        'CREATE', 'Associate a document with another record'),
  ('DOCUMENT_LINK_READ',       'View document links',      'DOCUMENT',        'READ',   'View document-entity associations')
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN: every new permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('DOCUMENT_FOLDER', 'DOCUMENT')
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('DOCUMENT_FOLDER', 'DOCUMENT')
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER: full access (document custodian for facility-related records)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL
  AND p.module IN ('DOCUMENT_FOLDER', 'DOCUMENT')
ON CONFLICT DO NOTHING;

-- PRESIDENT_SECRETARY, TREASURER, ACCOUNTANT, SECURITY_HEAD, AUDITOR,
-- VIEW_ONLY: read + download only. Actual visibility into sensitive
-- (CONFIDENTIAL) documents is still separately gated by
-- document_permissions at the service layer, not by this role grant alone.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('PRESIDENT_SECRETARY', 'TREASURER', 'ACCOUNTANT', 'SECURITY_HEAD', 'AUDITOR', 'VIEW_ONLY')
  AND r.society_id IS NULL
  AND p.code IN (
    'DOCUMENT_FOLDER_READ', 'DOCUMENT_READ', 'DOCUMENT_DOWNLOAD',
    'DOCUMENT_VERSION_READ', 'DOCUMENT_PERMISSION_READ', 'DOCUMENT_LINK_READ'
  )
ON CONFLICT DO NOTHING;

-- VENDOR: read + download only, and only documents explicitly shared
-- with them via document_permissions (their own contracts, etc.) -
-- enforced in the service layer, same as every other vendor-scoping
-- pattern in this project.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VENDOR' AND r.society_id IS NULL
  AND p.code IN ('DOCUMENT_READ', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_VERSION_READ')
ON CONFLICT DO NOTHING;

-- HELPDESK_MANAGER: intentionally no grants - outside their scope.
