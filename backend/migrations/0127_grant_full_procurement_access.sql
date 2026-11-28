-- Grant full procurement, purchase order, and goods receipt permissions to
-- President / Secretary, Auditor, and Accountant roles.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.society_id IS NULL
  AND r.code IN ('PRESIDENT_SECRETARY', 'AUDITOR', 'ACCOUNTANT')
  AND p.module IN ('PROCUREMENT', 'PURCHASE_ORDER', 'GOODS_RECEIPT')
ON CONFLICT DO NOTHING;
