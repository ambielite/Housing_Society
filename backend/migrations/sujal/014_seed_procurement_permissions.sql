-- =====================================================================
-- Migration 014: Vendor/Procurement permissions + Treasurer/Accountant
-- roles (needed now, per persona table, for approval and invoice duties)
-- =====================================================================

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('VENDOR_CREATE',              'Create vendor',                'VENDOR',         'CREATE', 'Onboard a new vendor'),
  ('VENDOR_READ',                'View vendors',                  'VENDOR',         'READ',   'View vendor master, contacts, documents, bank accounts, contracts'),
  ('VENDOR_UPDATE',              'Update vendor',                 'VENDOR',         'UPDATE', 'Update vendor master and its sub-records'),
  ('VENDOR_DELETE',              'Delete vendor',                 'VENDOR',         'DELETE', 'Delete a vendor record'),
  ('VENDOR_STATUS_UPDATE',       'Update vendor status',          'VENDOR',         'UPDATE', 'Suspend/blacklist/reactivate a vendor'),
  ('APPROVAL_CREATE',            'Raise approval request',        'APPROVAL',       'CREATE', 'Submit an entity for approval'),
  ('APPROVAL_READ',              'View approval requests',        'APPROVAL',       'READ',   'View approval requests and their action history'),
  ('APPROVAL_ACTION',            'Act on approval request',       'APPROVAL',       'UPDATE', 'Approve, reject, or request info on an approval request'),
  ('PURCHASE_REQUEST_CREATE',    'Create purchase request',       'PROCUREMENT',    'CREATE', 'Raise a purchase request'),
  ('PURCHASE_REQUEST_READ',      'View purchase requests',        'PROCUREMENT',    'READ',   'View purchase requests and lines'),
  ('PURCHASE_REQUEST_UPDATE',    'Update purchase request',       'PROCUREMENT',    'UPDATE', 'Update/submit/cancel a purchase request'),
  ('PURCHASE_REQUEST_DELETE',    'Delete purchase request',       'PROCUREMENT',    'DELETE', 'Delete a purchase request'),
  ('RFQ_CREATE',                 'Create RFQ',                     'PROCUREMENT',    'CREATE', 'Create an RFQ and invite vendors'),
  ('RFQ_READ',                   'View RFQs',                      'PROCUREMENT',    'READ',   'View RFQs and invited vendors'),
  ('RFQ_UPDATE',                 'Update RFQ',                     'PROCUREMENT',    'UPDATE', 'Close an RFQ'),
  ('QUOTATION_CREATE',           'Submit quotation',               'PROCUREMENT',    'CREATE', 'Submit a vendor quotation against an RFQ'),
  ('QUOTATION_READ',             'View quotations',                'PROCUREMENT',    'READ',   'View quotations and lines'),
  ('QUOTATION_UPDATE',           'Accept/reject quotation',        'PROCUREMENT',    'UPDATE', 'Accept or reject a submitted quotation'),
  ('QUOTATION_COMPARISON_MANAGE','Manage quotation comparison',    'PROCUREMENT',    'UPDATE', 'Record/view vendor comparison scores for an RFQ'),
  ('PURCHASE_ORDER_CREATE',      'Create purchase order',          'PURCHASE_ORDER', 'CREATE', 'Issue a purchase order'),
  ('PURCHASE_ORDER_READ',        'View purchase orders',           'PURCHASE_ORDER', 'READ',   'View purchase orders and lines'),
  ('PURCHASE_ORDER_UPDATE',      'Update purchase order',          'PURCHASE_ORDER', 'UPDATE', 'Amend or cancel a purchase order'),
  ('GOODS_RECEIPT_CREATE',       'Record goods receipt',           'GOODS_RECEIPT',  'CREATE', 'Record a goods/service receipt against a PO'),
  ('GOODS_RECEIPT_READ',         'View goods receipts',            'GOODS_RECEIPT',  'READ',   'View goods receipts and lines'),
  ('VENDOR_INVOICE_CREATE',      'Create vendor invoice',          'VENDOR_INVOICE', 'CREATE', 'Record a vendor invoice against a PO'),
  ('VENDOR_INVOICE_READ',        'View vendor invoices',           'VENDOR_INVOICE', 'READ',   'View vendor invoices and lines'),
  ('VENDOR_INVOICE_UPDATE',      'Verify/approve vendor invoice',  'VENDOR_INVOICE', 'UPDATE', 'Verify or approve a vendor invoice'),
  ('VENDOR_PAYMENT_CREATE',      'Record vendor payment',          'VENDOR_PAYMENT', 'CREATE', 'Allocate a payment against a vendor invoice'),
  ('VENDOR_PAYMENT_READ',        'View vendor payments',           'VENDOR_PAYMENT', 'READ',   'View vendor payment allocations')
ON CONFLICT (code) DO NOTHING;

-- New persona-based system roles required for this phase
INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Treasurer', 'TREASURER', 'Financial approvals, budgets, payments and reports', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Accountant', 'ACCOUNTANT', 'Billing, receipts, ledger, reconciliation, taxes', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'President / Secretary', 'PRESIDENT_SECRETARY', 'Governance, approvals, notices, meetings, escalations', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

-- SUPER_ADMIN: every new permission (bypass also applies automatically)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('VENDOR','APPROVAL','PROCUREMENT','PURCHASE_ORDER','GOODS_RECEIPT','VENDOR_INVOICE','VENDOR_PAYMENT')
ON CONFLICT DO NOTHING;

-- SOCIETY_ADMIN: full access across everything in this phase
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SOCIETY_ADMIN' AND r.society_id IS NULL
  AND p.module IN ('VENDOR','APPROVAL','PROCUREMENT','PURCHASE_ORDER','GOODS_RECEIPT','VENDOR_INVOICE','VENDOR_PAYMENT')
ON CONFLICT DO NOTHING;

-- FACILITY_MANAGER: operational owner of vendors/procurement (per persona
-- table: "Staff, assets, maintenance, vendors and facilities"). Can raise
-- and submit for approval, but NOT approve (maker-checker - approval
-- sits with Treasurer/Society Admin instead).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FACILITY_MANAGER' AND r.society_id IS NULL
  AND p.code IN (
    'VENDOR_CREATE','VENDOR_READ','VENDOR_UPDATE','VENDOR_STATUS_UPDATE',
    'APPROVAL_CREATE','APPROVAL_READ',
    'PURCHASE_REQUEST_CREATE','PURCHASE_REQUEST_READ','PURCHASE_REQUEST_UPDATE','PURCHASE_REQUEST_DELETE',
    'RFQ_CREATE','RFQ_READ','RFQ_UPDATE',
    'QUOTATION_CREATE','QUOTATION_READ','QUOTATION_UPDATE','QUOTATION_COMPARISON_MANAGE',
    'PURCHASE_ORDER_CREATE','PURCHASE_ORDER_READ','PURCHASE_ORDER_UPDATE',
    'GOODS_RECEIPT_CREATE','GOODS_RECEIPT_READ',
    'VENDOR_INVOICE_CREATE','VENDOR_INVOICE_READ',
    'VENDOR_PAYMENT_READ'
  )
ON CONFLICT DO NOTHING;

-- TREASURER: read + approval authority only (per persona table:
-- "Financial approvals, budgets, payments and reports" -> "Finance +
-- approval workflows"), not raw create/edit on procurement documents.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'TREASURER' AND r.society_id IS NULL
  AND p.code IN (
    'VENDOR_READ',
    'APPROVAL_READ','APPROVAL_ACTION',
    'PURCHASE_REQUEST_READ','RFQ_READ','QUOTATION_READ',
    'PURCHASE_ORDER_READ','GOODS_RECEIPT_READ',
    'VENDOR_INVOICE_READ','VENDOR_PAYMENT_READ'
  )
ON CONFLICT DO NOTHING;

-- ACCOUNTANT: vendor invoice + payment operations (per persona table:
-- "Billing, receipts, ledger, reconciliation, taxes" -> "Finance operations")
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ACCOUNTANT' AND r.society_id IS NULL
  AND p.code IN (
    'VENDOR_READ',
    'PURCHASE_ORDER_READ','GOODS_RECEIPT_READ',
    'VENDOR_INVOICE_CREATE','VENDOR_INVOICE_READ','VENDOR_INVOICE_UPDATE',
    'VENDOR_PAYMENT_CREATE','VENDOR_PAYMENT_READ'
  )
ON CONFLICT DO NOTHING;

-- PRESIDENT_SECRETARY: governance-level approval authority + read access
-- (per persona table: "Governance, approvals, notices, meetings,
-- escalations" -> "Governance + approvals + read access"). Distinct from
-- TREASURER's financial approval - this is the governance sign-off seat.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'PRESIDENT_SECRETARY' AND r.society_id IS NULL
  AND (
    p.code IN ('APPROVAL_READ', 'APPROVAL_ACTION')
    OR (p.module IN ('VENDOR','PROCUREMENT','PURCHASE_ORDER','GOODS_RECEIPT','VENDOR_INVOICE','VENDOR_PAYMENT') AND p.action = 'READ')
  )
ON CONFLICT DO NOTHING;

-- AUDITOR: read-only across everything (procurement/vendor spend IS
-- financial/audit data, unlike Parking - in scope this time)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'AUDITOR' AND r.society_id IS NULL
  AND p.module IN ('VENDOR','APPROVAL','PROCUREMENT','PURCHASE_ORDER','GOODS_RECEIPT','VENDOR_INVOICE','VENDOR_PAYMENT')
  AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- VIEW_ONLY: read-only across everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VIEW_ONLY' AND r.society_id IS NULL
  AND p.module IN ('VENDOR','APPROVAL','PROCUREMENT','PURCHASE_ORDER','GOODS_RECEIPT','VENDOR_INVOICE','VENDOR_PAYMENT')
  AND p.action = 'READ'
ON CONFLICT DO NOTHING;

-- VENDOR (the persona/role, not the "vendors" table): restricted scope
-- per persona table ("Only assigned work, contracts, tickets and
-- invoices" -> "Restricted vendor scope"). NOTE: true row-level scoping
-- to "only MY vendor record" is not enforced yet - there is no
-- users<->vendor link column in the current schema. These grants only
-- control WHICH actions are possible, not WHICH rows; treat this role
-- as not production-ready for external vendor logins until that gap
-- is closed in a later phase.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VENDOR' AND r.society_id IS NULL
  AND p.code IN (
    'VENDOR_READ','RFQ_READ',
    'QUOTATION_CREATE','QUOTATION_READ',
    'PURCHASE_ORDER_READ',
    'VENDOR_INVOICE_CREATE','VENDOR_INVOICE_READ'
  )
ON CONFLICT DO NOTHING;

-- SECURITY_HEAD: intentionally no grants here - outside their stated scope.
