const db = require('../../config/db');

const createRequest = async ({ societyId, entityType, entityId, approvalType }) => {
  const result = await db.query(
    `INSERT INTO approval_requests (society_id, entity_type, entity_id, approval_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [societyId, entityType, entityId, approvalType]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query(
    `SELECT ar.*, COALESCE(s.display_name, s.legal_name) AS society_display_name,
       CASE ar.entity_type
         WHEN 'PURCHASE_REQUEST' THEN (SELECT pr.request_no FROM purchase_requests pr WHERE pr.id = ar.entity_id)
         WHEN 'PURCHASE_ORDER' THEN (SELECT po.po_no FROM purchase_orders po WHERE po.id = ar.entity_id)
         WHEN 'VENDOR_INVOICE' THEN (SELECT vi.invoice_no FROM vendor_invoices vi WHERE vi.id = ar.entity_id)
       END AS entity_display_name
     FROM approval_requests ar
     LEFT JOIN societies s ON s.id = ar.society_id
     WHERE ar.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const findOpenForEntity = async (entityType, entityId) => {
  const result = await db.query(
    `SELECT * FROM approval_requests
     WHERE entity_type = $1 AND entity_id = $2 AND status = 'PENDING'`,
    [entityType, entityId]
  );
  return result.rows[0] || null;
};

const listRequests = async ({ societyId, entityType, entityId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`ar.society_id = $${idx++}`);
    params.push(societyId);
  }
  if (entityType) {
    conditions.push(`ar.entity_type = $${idx++}`);
    params.push(entityType);
  }
  if (entityId) {
    conditions.push(`ar.entity_id = $${idx++}`);
    params.push(entityId);
  }
  if (status) {
    conditions.push(`ar.status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT ar.*, COALESCE(s.display_name, s.legal_name) AS society_display_name,
       CASE ar.entity_type
         WHEN 'PURCHASE_REQUEST' THEN (SELECT pr.request_no FROM purchase_requests pr WHERE pr.id = ar.entity_id)
         WHEN 'PURCHASE_ORDER' THEN (SELECT po.po_no FROM purchase_orders po WHERE po.id = ar.entity_id)
         WHEN 'VENDOR_INVOICE' THEN (SELECT vi.invoice_no FROM vendor_invoices vi WHERE vi.id = ar.entity_id)
       END AS entity_display_name
     FROM approval_requests ar
     LEFT JOIN societies s ON s.id = ar.society_id
     ${whereClause}
     ORDER BY ar.created_at DESC`,
    params
  );
  return result.rows;
};

const updateStatus = async (id, status, currentLevel) => {
  const result = await db.query(
    `UPDATE approval_requests SET
       status        = $2,
       current_level = COALESCE($3, current_level),
       updated_at    = now()
     WHERE id = $1
     RETURNING *`,
    [id, status, currentLevel || null]
  );
  return result.rows[0] || null;
};

const addAction = async ({ approvalRequestId, approverId, level, decision, remarks }) => {
  const result = await db.query(
    `INSERT INTO approval_actions (approval_request_id, approver_id, level, decision, remarks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [approvalRequestId, approverId, level, decision, remarks || null]
  );
  return result.rows[0];
};

const listActions = async (approvalRequestId) => {
  const result = await db.query(
    `SELECT aa.*, concat_ws(' ', u.first_name, u.last_name) AS approver_name, u.email AS approver_email
     FROM approval_actions aa
     LEFT JOIN users u ON u.id = aa.approver_id
     WHERE aa.approval_request_id = $1
     ORDER BY aa.action_at ASC`,
    [approvalRequestId]
  );
  return result.rows;
};

module.exports = {
  createRequest,
  findById,
  findOpenForEntity,
  listRequests,
  updateStatus,
  addAction,
  listActions,
};
