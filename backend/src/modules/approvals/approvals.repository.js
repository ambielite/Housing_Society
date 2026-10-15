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
  const result = await db.query('SELECT * FROM approval_requests WHERE id = $1', [id]);
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
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (entityType) {
    conditions.push(`entity_type = $${idx++}`);
    params.push(entityType);
  }
  if (entityId) {
    conditions.push(`entity_id = $${idx++}`);
    params.push(entityId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM approval_requests ${whereClause} ORDER BY created_at DESC`,
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
    'SELECT * FROM approval_actions WHERE approval_request_id = $1 ORDER BY action_at ASC',
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
