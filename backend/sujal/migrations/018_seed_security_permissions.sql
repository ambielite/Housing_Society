-- =====================================================================
-- Migration 018: Security/Gate/Visitor/Delivery permissions
-- No new roles needed - all personas relevant to this phase already
-- exist (SECURITY_HEAD from Phase 4, SOCIETY_ADMIN/FACILITY_MANAGER/
-- PRESIDENT_SECRETARY/AUDITOR/VIEW_ONLY from earlier phases).
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('GATE_CREATE',            'Create gate',                'GATE',     'CREATE', 'Create a society gate'),
  ('GATE_READ',              'View gates',                  'GATE',     'READ',   'View gates'),
  ('GATE_UPDATE',            'Update gate',                 'GATE',     'UPDATE', 'Update a gate'),
  ('GATE_DELETE',            'Delete gate',                 'GATE',     'DELETE', 'Delete a gate'),
  ('SECURITY_GUARD_CREATE',  'Add security guard',          'GATE',     'CREATE', 'Register a security guard'),
  ('SECURITY_GUARD_READ',    'View security guards',        'GATE',     'READ',   'View security guards'),
  ('SECURITY_GUARD_UPDATE',  'Update security guard',       'GATE',     'UPDATE', 'Update a security guard record'),
  ('SECURITY_GUARD_DELETE',  'Delete security guard',       'GATE',     'DELETE', 'Delete a security guard record'),
  ('ACCESS_CARD_CREATE',     'Issue access card',            'GATE',     'CREATE', 'Issue an access card/credential'),
  ('ACCESS_CARD_READ',       'View access cards',            'GATE',     'READ',   'View access cards/credentials'),
  ('ACCESS_CARD_UPDATE',     'Update access card',           'GATE',     'UPDATE', 'Revoke or update an access card'),
  ('GATE_DEVICE_CREATE',     'Register gate device',         'GATE',     'CREATE', 'Register a gate hardware device'),
  ('GATE_DEVICE_READ',       'View gate devices',            'GATE',     'READ',   'View gate devices and health status'),
  ('GATE_DEVICE_UPDATE',     'Update gate device',           'GATE',     'UPDATE', 'Update a gate device'),
  ('DEVICE_EVENT_CREATE',    'Ingest device event',          'GATE',     'CREATE', 'Record an incoming device event'),
  ('DEVICE_EVENT_READ',      'View device events',           'GATE',     'READ',   'View device event log'),
  ('VISITOR_PROFILE_CREATE', 'Create visitor profile',       'VISITOR',  'CREATE', 'Register a visitor profile'),
  ('VISITOR_PROFILE_READ',   'View visitor profiles',        'VISITOR',  'READ',   'View visitor profiles'),
  ('VISITOR_PROFILE_UPDATE', 'Update visitor profile',       'VISITOR',  'UPDATE', 'Update/blacklist a visitor profile'),
  ('VISITOR_INVITE_CREATE',  'Create visitor invite',        'VISITOR',  'CREATE', 'Pre-approve an expected visitor'),
  ('VISITOR_INVITE_READ',    'View visitor invites',         'VISITOR',  'READ',   'View visitor invites'),
  ('VISITOR_INVITE_UPDATE',  'Decide visitor invite',        'VISITOR',  'UPDATE', 'Approve/reject/cancel a visitor invite'),
  ('VISITOR_PASS_CREATE',    'Create visitor pass',          'VISITOR',  'CREATE', 'Issue a visitor pass (invited or walk-in)'),
  ('VISITOR_PASS_READ',      'View visitor passes',          'VISITOR',  'READ',   'View visitor passes'),
  ('VISITOR_PASS_UPDATE',    'Update visitor pass',          'VISITOR',  'UPDATE', 'Record entry/exit or cancel a visitor pass'),
  ('GATE_EVENT_READ',        'View gate events',             'VISITOR',  'READ',   'View the gate entry/exit log'),
  ('OVERSTAY_ALERT_READ',    'View overstay alerts',         'VISITOR',  'READ',   'View overstay alerts'),
  ('OVERSTAY_ALERT_UPDATE',  'Acknowledge overstay alert',   'VISITOR',  'UPDATE', 'Acknowledge/resolve an overstay alert'),
  ('DELIVERY_CREATE',        'Create delivery',              'DELIVERY', 'CREATE', 'Register an incoming delivery'),
  ('DELIVERY_READ',          'View deliveries',              'DELIVERY', 'READ',   'View deliveries'),
  ('DELIVERY_UPDATE',        'Update delivery',              'DELIVERY', 'UPDATE', 'Update delivery status'),
  ('PARCEL_CREATE',          'Create parcel',                'DELIVERY', 'CREATE', 'Log a parcel for storage'),
  ('PARCEL_READ',            'View parcels',                 'DELIVERY', 'READ',   'View stored/collected parcels'),
  ('PARCEL_UPDATE',          'Update parcel',                'DELIVERY', 'UPDATE', 'Mark a parcel collected/damaged/lost')
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN: every new permission (bypass also applies automatically)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('GATE','VISITOR','DELIVERY')
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('GATE','VISITOR','DELIVERY')
ON CONFLICT DO NOTHING;

-- SECURITY_HEAD: full access - this is explicitly their domain
-- (persona table: "Visitors, gates, guards, patrols and incidents" -> "Security")
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SECURITY_HEAD' AND r.society_id IS NULL
  AND p.module IN ('GATE','VISITOR','DELIVERY')
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER: read-only visibility (not their operational domain,
-- but they need to see gate/delivery activity affecting facilities)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL
  AND p.module IN ('GATE','VISITOR','DELIVERY') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- PRESIDENT_SECRETARY: read-only (per persona table: "...+ read access")
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'PRESIDENT_SECRETARY' AND r.society_id IS NULL
  AND p.module IN ('GATE','VISITOR','DELIVERY') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- AUDITOR: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'AUDITOR' AND r.society_id IS NULL
  AND p.module IN ('GATE','VISITOR','DELIVERY') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- VIEW_ONLY: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VIEW_ONLY' AND r.society_id IS NULL
  AND p.module IN ('GATE','VISITOR','DELIVERY') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- TREASURER, ACCOUNTANT, VENDOR: intentionally no grants - outside scope.
