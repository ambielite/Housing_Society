-- =====================================================================
-- Migration 025: Helpdesk/SLA/Escalation permissions + Helpdesk
-- Manager role (needed now - this is explicitly their phase per the
-- persona table: "Tickets, SLA, assignments and escalations" -> "Helpdesk")
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('TICKET_CATEGORY_CREATE',      'Create ticket category',       'HELPDESK_SETUP', 'CREATE', 'Create a ticket category'),
  ('TICKET_CATEGORY_READ',        'View ticket categories',       'HELPDESK_SETUP', 'READ',   'View ticket categories'),
  ('TICKET_CATEGORY_UPDATE',      'Update ticket category',       'HELPDESK_SETUP', 'UPDATE', 'Update a ticket category'),
  ('TICKET_CATEGORY_DELETE',      'Delete ticket category',       'HELPDESK_SETUP', 'DELETE', 'Delete a ticket category'),
  ('SLA_POLICY_CREATE',           'Create SLA policy',            'HELPDESK_SETUP', 'CREATE', 'Create an SLA policy'),
  ('SLA_POLICY_READ',             'View SLA policies',            'HELPDESK_SETUP', 'READ',   'View SLA policies'),
  ('SLA_POLICY_UPDATE',           'Update SLA policy',            'HELPDESK_SETUP', 'UPDATE', 'Update an SLA policy'),
  ('SLA_POLICY_DELETE',           'Delete SLA policy',            'HELPDESK_SETUP', 'DELETE', 'Delete an SLA policy'),
  ('ESCALATION_RULE_CREATE',      'Create escalation rule',       'HELPDESK_SETUP', 'CREATE', 'Create an escalation rule'),
  ('ESCALATION_RULE_READ',        'View escalation rules',        'HELPDESK_SETUP', 'READ',   'View escalation rules'),
  ('ESCALATION_RULE_UPDATE',      'Update escalation rule',       'HELPDESK_SETUP', 'UPDATE', 'Update an escalation rule'),
  ('ESCALATION_RULE_DELETE',      'Delete escalation rule',       'HELPDESK_SETUP', 'DELETE', 'Delete an escalation rule'),
  ('TICKET_CREATE',               'Create ticket',                'TICKET',         'CREATE', 'Raise a helpdesk ticket'),
  ('TICKET_READ',                 'View tickets',                 'TICKET',         'READ',   'View tickets'),
  ('TICKET_UPDATE',               'Update ticket',                'TICKET',         'UPDATE', 'Update ticket status/details'),
  ('TICKET_DELETE',               'Delete ticket',                'TICKET',         'DELETE', 'Delete a ticket'),
  ('TICKET_ASSIGN',               'Assign ticket',                'TICKET',         'ASSIGN', 'Assign/unassign a ticket to staff or vendor'),
  ('TICKET_COMMENT_CREATE',       'Add ticket comment',           'TICKET',         'CREATE', 'Add a comment to a ticket'),
  ('TICKET_COMMENT_READ',         'View ticket comments',         'TICKET',         'READ',   'View the ticket comment thread'),
  ('TICKET_ATTACHMENT_CREATE',    'Add ticket attachment',        'TICKET',         'CREATE', 'Attach a file to a ticket'),
  ('TICKET_ATTACHMENT_READ',      'View ticket attachments',      'TICKET',         'READ',   'View ticket attachments'),
  ('TICKET_RATING_CREATE',        'Rate ticket',                  'TICKET',         'CREATE', 'Rate a closed ticket'),
  ('TICKET_RATING_READ',          'View ticket ratings',          'TICKET',         'READ',   'View ticket ratings'),
  ('SLA_TIMER_READ',              'View SLA timers',              'SLA',            'READ',   'View SLA timer status and breach state'),
  ('TICKET_ESCALATION_READ',      'View ticket escalations',      'SLA',            'READ',   'View fired escalations'),
  ('TICKET_ESCALATION_ACKNOWLEDGE','Acknowledge escalation',      'SLA',            'UPDATE', 'Acknowledge/resolve a fired escalation')
ON CONFLICT (code) DO NOTHING;

-- New persona-based system role required for this phase
INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Helpdesk Manager', 'HELPDESK_MANAGER', 'Tickets, SLA, assignments and escalations', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

-- SUPER_ADMIN: every new permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA')
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA')
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER: full access (Tier 1 escalation target - needs real access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL
  AND p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA')
ON CONFLICT DO NOTHING;

-- HELPDESK_MANAGER: full access - this is explicitly their domain
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'HELPDESK_MANAGER' AND r.society_id IS NULL
  AND p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA')
ON CONFLICT DO NOTHING;

-- PRESIDENT_SECRETARY: read-only + escalation acknowledgement
-- (they are the Tier 2 escalation target per the spec's example)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'PRESIDENT_SECRETARY' AND r.society_id IS NULL
  AND (
    p.code = 'TICKET_ESCALATION_ACKNOWLEDGE'
    OR (p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA') AND p.action = 'READ')
  )
ON CONFLICT DO NOTHING;

-- SECURITY_HEAD: read-only (visibility into security-category tickets)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SECURITY_HEAD' AND r.society_id IS NULL
  AND p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- AUDITOR: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'AUDITOR' AND r.society_id IS NULL
  AND p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- VIEW_ONLY: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VIEW_ONLY' AND r.society_id IS NULL
  AND p.module IN ('HELPDESK_SETUP', 'TICKET', 'SLA') AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- VENDOR: can view and comment only on tickets assigned to them
-- (row-level scoping to their own vendor_id is enforced in the service
-- layer, same pattern as Phase 8's vendor-scoping fix - this grant only
-- controls WHICH actions are possible, not WHICH rows).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VENDOR' AND r.society_id IS NULL
  AND p.code IN ('TICKET_READ', 'TICKET_COMMENT_CREATE', 'TICKET_COMMENT_READ', 'TICKET_ATTACHMENT_READ')
ON CONFLICT DO NOTHING;

-- TREASURER, ACCOUNTANT: intentionally no grants - outside their scope.
