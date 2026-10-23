-- Society notice board with read tracking and reusable notice templates.
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  posted_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED'
    CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'EXPIRED')),
  renotified_at TIMESTAMPTZ,
  renotify_count INTEGER NOT NULL DEFAULT 0 CHECK (renotify_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR scheduled_at IS NULL OR expires_at > scheduled_at)
);

CREATE INDEX IF NOT EXISTS notices_society_status_schedule_idx
  ON notices (society_id, status, scheduled_at, expires_at);
CREATE INDEX IF NOT EXISTS notices_society_created_idx
  ON notices (society_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notice_id, user_id)
);

CREATE INDEX IF NOT EXISTS notice_reads_society_notice_idx
  ON notice_reads (society_id, notice_id);

CREATE TABLE IF NOT EXISTS notice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notice_templates_society_created_idx
  ON notice_templates (society_id, created_at DESC);

INSERT INTO permissions (code, name, module, action, description)
VALUES
  ('NOTICE_CREATE', 'Create notices', 'NOTICE', 'CREATE', 'Create and schedule society notices'),
  ('NOTICE_READ', 'View notices', 'NOTICE', 'READ', 'View society notices and readership'),
  ('NOTICE_UPDATE', 'Manage notices', 'NOTICE', 'UPDATE', 'Edit, expire and renotify society notices'),
  ('NOTICE_DELETE', 'Delete notices', 'NOTICE', 'DELETE', 'Delete society notices')
ON CONFLICT (code) DO NOTHING;

-- Grant notice access to society administrators and governance officers.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.society_id IS NULL
  AND r.code IN ('SUPER_ADMIN', 'SOCIETY_ADMIN', 'PRESIDENT_SECRETARY')
  AND p.module = 'NOTICE'
ON CONFLICT DO NOTHING;

-- The view-only persona can read notices without managing them.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.society_id IS NULL
  AND r.code = 'VIEW_ONLY'
  AND p.module = 'NOTICE'
  AND p.action = 'READ'
ON CONFLICT DO NOTHING;
