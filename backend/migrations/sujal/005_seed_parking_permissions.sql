-- =====================================================================
-- Migration 005: Parking/Vehicle permissions + persona role grants
-- Adds FACILITY_MANAGER, SECURITY_HEAD, AUDITOR, VENDOR system roles
-- (from the "User Personas and Stakeholders" table) since they didn't
-- exist yet, then grants Parking/Vehicle permissions per that table.
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('PARKING_AREA_CREATE',       'Create parking area',        'PARKING', 'CREATE', 'Create a parking area'),
  ('PARKING_AREA_READ',         'View parking areas',         'PARKING', 'READ',   'View parking areas'),
  ('PARKING_AREA_UPDATE',       'Update parking area',        'PARKING', 'UPDATE', 'Update a parking area'),
  ('PARKING_AREA_DELETE',       'Delete parking area',        'PARKING', 'DELETE', 'Delete a parking area'),
  ('PARKING_SLOT_CREATE',       'Create parking slot',        'PARKING', 'CREATE', 'Create a parking slot/bay'),
  ('PARKING_SLOT_READ',         'View parking slots',         'PARKING', 'READ',   'View parking slots/bays'),
  ('PARKING_SLOT_UPDATE',       'Update parking slot',        'PARKING', 'UPDATE', 'Update a parking slot/bay'),
  ('PARKING_SLOT_DELETE',       'Delete parking slot',        'PARKING', 'DELETE', 'Delete a parking slot/bay'),
  ('PARKING_ALLOCATION_CREATE', 'Create parking allocation',  'PARKING', 'CREATE', 'Allocate a bay to a unit/resident'),
  ('PARKING_ALLOCATION_READ',   'View parking allocations',   'PARKING', 'READ',   'View parking allocations'),
  ('PARKING_ALLOCATION_UPDATE', 'Update parking allocation',  'PARKING', 'UPDATE', 'Update/end a parking allocation'),
  ('PARKING_ALLOCATION_DELETE', 'Delete parking allocation',  'PARKING', 'DELETE', 'Delete a parking allocation'),
  ('VEHICLE_CREATE',            'Register vehicle',           'VEHICLE', 'CREATE', 'Register a resident vehicle'),
  ('VEHICLE_READ',              'View vehicles',               'VEHICLE', 'READ',   'View registered vehicles'),
  ('VEHICLE_UPDATE',            'Update vehicle',              'VEHICLE', 'UPDATE', 'Update a vehicle record'),
  ('VEHICLE_DELETE',            'Delete vehicle',              'VEHICLE', 'DELETE', 'Deactivate/delete a vehicle'),
  ('VEHICLE_CREDENTIAL_ASSIGN', 'Assign vehicle credential',   'VEHICLE', 'ASSIGN', 'Issue/revoke RFID or access credential'),
  ('PARKING_VISIT_CREATE',      'Log parking visit',           'PARKING', 'CREATE', 'Log a vehicle entry at a parking slot'),
  ('PARKING_VISIT_READ',        'View parking visits',         'PARKING', 'READ',   'View parking visit/gate log'),
  ('PARKING_VISIT_UPDATE',      'Update parking visit',        'PARKING', 'UPDATE', 'Log a vehicle exit / update visit status')
ON CONFLICT (code) DO NOTHING;

-- New persona-based system roles (global, society_id IS NULL)
INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Facility Manager', 'FACILITY_MANAGER', 'Staff, assets, maintenance, vendors and facilities', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Security Head', 'SECURITY_HEAD', 'Visitors, gates, guards, patrols and incidents', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Auditor', 'AUDITOR', 'Read-only financial/audit information', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Vendor', 'VENDOR', 'Only assigned work, contracts, tickets and invoices', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

-- SUPER_ADMIN: granted every new permission for completeness/visibility
-- (authMiddleware also hard-bypasses permission checks for this role).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('PARKING', 'VEHICLE')
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: full CRUD across parking + vehicles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('PARKING', 'VEHICLE')
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER: full CRUD across parking + vehicles (per persona table:
-- "Staff, assets, maintenance, vendors AND facilities" -> parking is a facility)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL
  AND p.module IN ('PARKING', 'VEHICLE')
ON CONFLICT DO NOTHING;

-- SECURITY_HEAD: read everything + credential assign + log visits
-- (gate/vehicle movement is a security operation, per persona table)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SECURITY_HEAD' AND r.society_id IS NULL
  AND p.code IN (
    'PARKING_AREA_READ', 'PARKING_SLOT_READ', 'PARKING_ALLOCATION_READ',
    'VEHICLE_READ', 'VEHICLE_CREATE', 'VEHICLE_UPDATE', 'VEHICLE_CREDENTIAL_ASSIGN',
    'PARKING_VISIT_CREATE', 'PARKING_VISIT_READ', 'PARKING_VISIT_UPDATE'
  )
ON CONFLICT DO NOTHING;

-- AUDITOR: intentionally NO grants here. Persona table scopes Auditor to
-- "Read-only financial/audit information" - Parking/Vehicle is
-- operational data, not financial, so it's outside this role's stated
-- access. Revisit when Phase 5 (Financial ERP) introduces audit exports
-- that may touch parking fee/billing data.

-- VIEW_ONLY: read-only across parking + vehicles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VIEW_ONLY' AND r.society_id IS NULL
  AND p.module IN ('PARKING', 'VEHICLE') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- VENDOR: no parking/vehicle access (out of restricted vendor scope,
-- per persona table: "Only assigned work, contracts, tickets and invoices")
-- -> intentionally no grants here.