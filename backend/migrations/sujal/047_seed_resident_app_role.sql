-- Resident mobile-app role.
-- Keep this role read-only and grant only society-level information that is
-- appropriate for resident accounts. Personal records (visitor invites,
-- bookings, tickets, vehicles, invoices, and resident profiles) are omitted
-- until their APIs enforce ownership using the authenticated user.

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (
  NULL,
  'Resident',
  'RESIDENT_APP',
  'Resident mobile access to society information and amenity availability',
  true,
  'ACTIVE'
)
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.society_id IS NULL
  AND r.code = 'RESIDENT_APP'
  AND p.code IN (
    'SOCIETY_READ',
    'AMENITY_READ',
    'AMENITY_SLOT_READ',
    'AMENITY_PRICING_RULE_READ',
    'AMENITY_BLOCKOUT_READ',
    'SOCIETY_COMMITTEE_READ',
    'SOCIETY_EMERGENCY_CONTACT_READ',
    'NOTIFICATION_READ'
  )
ON CONFLICT DO NOTHING;
