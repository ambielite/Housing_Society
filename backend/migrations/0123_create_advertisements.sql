CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  max_views_per_resident INTEGER NOT NULL CHECK (max_views_per_resident BETWEEN 1 AND 1000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS advertisements_society_active_dates_idx
  ON advertisements (society_id, is_active, starts_on, ends_on);

CREATE TABLE IF NOT EXISTS advertisement_resident_state (
  advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  impression_count INTEGER NOT NULL DEFAULT 0 CHECK (impression_count >= 0),
  dismissed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (advertisement_id, user_id)
);

CREATE INDEX IF NOT EXISTS advertisement_resident_state_user_idx
  ON advertisement_resident_state (society_id, user_id);

INSERT INTO permissions (code, name, module, action, description)
VALUES
  ('ADVERTISEMENT_CREATE', 'Create advertisements', 'ADVERTISEMENT', 'CREATE', 'Create resident advertisements'),
  ('ADVERTISEMENT_READ', 'View advertisements', 'ADVERTISEMENT', 'READ', 'View and manage resident advertisements'),
  ('ADVERTISEMENT_UPDATE', 'Update advertisements', 'ADVERTISEMENT', 'UPDATE', 'Edit and activate or deactivate advertisements'),
  ('ADVERTISEMENT_DELETE', 'Delete advertisements', 'ADVERTISEMENT', 'DELETE', 'Delete advertisements')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM roles r CROSS JOIN permissions p
 WHERE r.society_id IS NULL
   AND r.code IN ('SUPER_ADMIN', 'SOCIETY_ADMIN')
   AND p.module = 'ADVERTISEMENT'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM roles r CROSS JOIN permissions p
 WHERE r.society_id IS NULL
   AND r.code = 'VIEW_ONLY'
   AND p.module = 'ADVERTISEMENT' AND p.action = 'READ'
ON CONFLICT DO NOTHING;
