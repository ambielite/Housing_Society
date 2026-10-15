-- =====================================================================
-- Migration 021: Amenity permissions
-- No new roles needed - all relevant personas already exist.
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('AMENITY_CREATE',              'Create amenity',              'AMENITY',         'CREATE', 'Create an amenity'),
  ('AMENITY_READ',                'View amenities',               'AMENITY',         'READ',   'View amenities'),
  ('AMENITY_UPDATE',              'Update amenity',               'AMENITY',         'UPDATE', 'Update an amenity'),
  ('AMENITY_DELETE',              'Delete amenity',               'AMENITY',         'DELETE', 'Delete an amenity'),
  ('AMENITY_SLOT_CREATE',         'Create amenity slot',          'AMENITY',         'CREATE', 'Create a bookable slot'),
  ('AMENITY_SLOT_READ',           'View amenity slots',           'AMENITY',         'READ',   'View amenity slots'),
  ('AMENITY_SLOT_UPDATE',         'Update amenity slot',          'AMENITY',         'UPDATE', 'Update a slot'),
  ('AMENITY_SLOT_DELETE',         'Delete amenity slot',          'AMENITY',         'DELETE', 'Delete a slot'),
  ('AMENITY_PRICING_RULE_CREATE', 'Create pricing rule',          'AMENITY',         'CREATE', 'Create a dynamic pricing rule'),
  ('AMENITY_PRICING_RULE_READ',   'View pricing rules',           'AMENITY',         'READ',   'View pricing rules'),
  ('AMENITY_PRICING_RULE_UPDATE', 'Update pricing rule',          'AMENITY',         'UPDATE', 'Update a pricing rule'),
  ('AMENITY_PRICING_RULE_DELETE', 'Delete pricing rule',          'AMENITY',         'DELETE', 'Delete a pricing rule'),
  ('AMENITY_BLOCKOUT_CREATE',     'Create blockout',              'AMENITY',         'CREATE', 'Block out an amenity for maintenance/events'),
  ('AMENITY_BLOCKOUT_READ',       'View blockouts',               'AMENITY',         'READ',   'View blockout windows'),
  ('AMENITY_BLOCKOUT_DELETE',     'Delete blockout',              'AMENITY',         'DELETE', 'Remove a blockout window'),
  ('AMENITY_BOOKING_CREATE',      'Create amenity booking',       'AMENITY_BOOKING', 'CREATE', 'Book an amenity slot'),
  ('AMENITY_BOOKING_READ',        'View amenity bookings',        'AMENITY_BOOKING', 'READ',   'View amenity bookings'),
  ('AMENITY_BOOKING_UPDATE',      'Update amenity booking',       'AMENITY_BOOKING', 'UPDATE', 'Confirm/cancel/mark no-show on a booking'),
  ('AMENITY_BOOKING_DELETE',      'Delete amenity booking',       'AMENITY_BOOKING', 'DELETE', 'Delete a booking record')
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN: every new permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('AMENITY', 'AMENITY_BOOKING')
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('AMENITY', 'AMENITY_BOOKING')
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER: full access (amenities are their operational domain)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL
  AND p.module IN ('AMENITY', 'AMENITY_BOOKING')
ON CONFLICT DO NOTHING;

-- PRESIDENT_SECRETARY: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'PRESIDENT_SECRETARY' AND r.society_id IS NULL
  AND p.module IN ('AMENITY', 'AMENITY_BOOKING') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- AUDITOR: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'AUDITOR' AND r.society_id IS NULL
  AND p.module IN ('AMENITY', 'AMENITY_BOOKING') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- VIEW_ONLY: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VIEW_ONLY' AND r.society_id IS NULL
  AND p.module IN ('AMENITY', 'AMENITY_BOOKING') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- TREASURER, ACCOUNTANT: read-only on BOOKINGS only (revenue/utilization
-- visibility per persona table's finance scope) - not amenity setup.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('TREASURER', 'ACCOUNTANT') AND r.society_id IS NULL
  AND p.code = 'AMENITY_BOOKING_READ'
ON CONFLICT DO NOTHING;

-- SECURITY_HEAD, VENDOR: intentionally no grants - outside their scope.
