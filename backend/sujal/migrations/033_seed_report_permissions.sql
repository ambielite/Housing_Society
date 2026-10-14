-- =====================================================================
-- Migration 033: Reports Center permissions (Phase 17)
-- Permissions only - reports read the existing tables, no new tables/columns.
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('REPORT_DASHBOARD_READ',   'View reports dashboard',    'REPORT', 'READ',   'View the operations/security/helpdesk dashboard widgets'),
  ('REPORT_OPERATIONS_READ',  'View operations reports',   'REPORT', 'READ',   'View vehicle and parking reports'),
  ('REPORT_SECURITY_READ',    'View security reports',     'REPORT', 'READ',   'View visitor, gate, overstay and delivery reports'),
  ('REPORT_HELPDESK_READ',    'View helpdesk reports',     'REPORT', 'READ',   'View ticket, SLA and category trend reports'),
  ('REPORT_VENDOR_READ',      'View vendor reports',       'REPORT', 'READ',   'View vendor outstanding, contract, spend and SLA reports'),
  ('REPORT_PROCUREMENT_READ', 'View procurement reports',  'REPORT', 'READ',   'View PR/RFQ/quotation/PO/vendor bill reports'),
  ('REPORT_AMENITY_READ',     'View amenity reports',      'REPORT', 'READ',   'View amenity utilization, revenue and cancellation reports'),
  ('REPORT_UTILITY_READ',     'View utility reports',      'REPORT', 'READ',   'View utility consumption and billing reports'),
  ('REPORT_EXPORT',           'Export reports',            'REPORT', 'EXPORT', 'Download reports as CSV')
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN, SOCIETY_ADMIN: everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('SUPER_ADMIN', 'SOCIETY_ADMIN') AND r.society_id IS NULL AND p.module = 'REPORT'
ON CONFLICT DO NOTHING;

-- PRESIDENT_SECRETARY ("Governance + approvals + read access"),
-- VIEW_ONLY ("Operational visibility without mutation", read-only): all read, no export
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('PRESIDENT_SECRETARY', 'VIEW_ONLY') AND r.society_id IS NULL
  AND p.module = 'REPORT' AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER ("Staff, assets, maintenance, vendors and facilities"): everything except security reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL
  AND p.module = 'REPORT' AND p.code <> 'REPORT_SECURITY_READ'
ON CONFLICT DO NOTHING;

-- ACCOUNTANT, AUDITOR ("Read-only financial/audit information; read/export as granted"), TREASURER:
-- money-related reports only (vendor, procurement, amenity revenue, utility billing) + export.
-- AUDITOR deliberately gets no operational reports - same rule as migration 006.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('ACCOUNTANT', 'AUDITOR', 'TREASURER') AND r.society_id IS NULL
  AND p.code IN ('REPORT_VENDOR_READ', 'REPORT_PROCUREMENT_READ', 'REPORT_AMENITY_READ',
                 'REPORT_UTILITY_READ', 'REPORT_EXPORT')
ON CONFLICT DO NOTHING;

-- TREASURER ("financial approvals"): also the dashboard (pending approvals / payments widgets)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'TREASURER' AND r.society_id IS NULL AND p.code = 'REPORT_DASHBOARD_READ'
ON CONFLICT DO NOTHING;

-- SECURITY_HEAD ("Visitors, gates, guards, patrols and incidents"): security + vehicle/parking reports, can export
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SECURITY_HEAD' AND r.society_id IS NULL
  AND p.code IN ('REPORT_SECURITY_READ', 'REPORT_OPERATIONS_READ', 'REPORT_EXPORT')
ON CONFLICT DO NOTHING;

-- HELPDESK_MANAGER ("Tickets, SLA, assignments and escalations"): helpdesk reports, can export
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'HELPDESK_MANAGER' AND r.society_id IS NULL
  AND p.code IN ('REPORT_HELPDESK_READ', 'REPORT_EXPORT')
ON CONFLICT DO NOTHING;

-- VENDOR ("Only assigned work, contracts, tickets and invoices"): intentionally no report access.