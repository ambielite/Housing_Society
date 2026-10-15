const db = require('../../config/db');

// --- sla_policies -------------------------------------------------------------

const createPolicy = async ({ societyId, name, responseMinutes, resolutionMinutes, pauseOnWaiting }) => {
  const result = await db.query(
    `INSERT INTO sla_policies (society_id, name, response_minutes, resolution_minutes, pause_on_waiting)
     VALUES ($1, $2, $3, $4, COALESCE($5, true))
     RETURNING *`,
    [societyId, name, responseMinutes, resolutionMinutes, pauseOnWaiting]
  );
  return result.rows[0];
};

const findPolicyById = async (id) => {
  const result = await db.query('SELECT * FROM sla_policies WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listPolicies = async (societyId) => {
  const result = await db.query(
    'SELECT * FROM sla_policies WHERE society_id = $1 ORDER BY created_at DESC',
    [societyId]
  );
  return result.rows;
};

const updatePolicy = async (id, { name, responseMinutes, resolutionMinutes, pauseOnWaiting, status }) => {
  const result = await db.query(
    `UPDATE sla_policies SET
       name                 = COALESCE($2, name),
       response_minutes     = COALESCE($3, response_minutes),
       resolution_minutes   = COALESCE($4, resolution_minutes),
       pause_on_waiting     = COALESCE($5, pause_on_waiting),
       status               = COALESCE($6, status),
       updated_at           = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, responseMinutes, resolutionMinutes, pauseOnWaiting, status]
  );
  return result.rows[0] || null;
};

const deletePolicy = async (id) => {
  const result = await db.query('DELETE FROM sla_policies WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- ticket_categories ----------------------------------------------------------

const createCategory = async ({ societyId, parentCategoryId, name, code, defaultPriority, slaPolicyId }) => {
  const result = await db.query(
    `INSERT INTO ticket_categories (society_id, parent_category_id, name, code, default_priority, sla_policy_id)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'MEDIUM'), $6)
     RETURNING *`,
    [societyId, parentCategoryId || null, name, code, defaultPriority, slaPolicyId || null]
  );
  return result.rows[0];
};

const findCategoryById = async (id) => {
  const result = await db.query('SELECT * FROM ticket_categories WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listCategories = async ({ societyId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM ticket_categories ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateCategory = async (id, { name, defaultPriority, slaPolicyId, status }) => {
  const result = await db.query(
    `UPDATE ticket_categories SET
       name              = COALESCE($2, name),
       default_priority  = COALESCE($3, default_priority),
       sla_policy_id     = COALESCE($4, sla_policy_id),
       status            = COALESCE($5, status),
       updated_at        = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, defaultPriority, slaPolicyId, status]
  );
  return result.rows[0] || null;
};

const deleteCategory = async (id) => {
  const result = await db.query('DELETE FROM ticket_categories WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- escalation_rules -------------------------------------------------------------

const createRule = async ({ slaPolicyId, thresholdType, thresholdValue, escalationLevel, targetRoleId, targetUserId }) => {
  const result = await db.query(
    `INSERT INTO escalation_rules (sla_policy_id, threshold_type, threshold_value, escalation_level, target_role_id, target_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [slaPolicyId, thresholdType, thresholdValue || 0, escalationLevel, targetRoleId, targetUserId || null]
  );
  return result.rows[0];
};

const findRuleById = async (id) => {
  const result = await db.query('SELECT * FROM escalation_rules WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listRulesForPolicy = async (slaPolicyId) => {
  const result = await db.query(
    'SELECT * FROM escalation_rules WHERE sla_policy_id = $1 ORDER BY escalation_level ASC',
    [slaPolicyId]
  );
  return result.rows;
};

const updateRule = async (id, { thresholdType, thresholdValue, escalationLevel, targetRoleId, targetUserId }) => {
  const result = await db.query(
    `UPDATE escalation_rules SET
       threshold_type    = COALESCE($2, threshold_type),
       threshold_value   = COALESCE($3, threshold_value),
       escalation_level  = COALESCE($4, escalation_level),
       target_role_id    = COALESCE($5, target_role_id),
       target_user_id    = COALESCE($6, target_user_id)
     WHERE id = $1
     RETURNING *`,
    [id, thresholdType, thresholdValue, escalationLevel, targetRoleId, targetUserId]
  );
  return result.rows[0] || null;
};

const deleteRule = async (id) => {
  const result = await db.query('DELETE FROM escalation_rules WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

module.exports = {
  createPolicy,
  findPolicyById,
  listPolicies,
  updatePolicy,
  deletePolicy,
  createCategory,
  findCategoryById,
  listCategories,
  updateCategory,
  deleteCategory,
  createRule,
  findRuleById,
  listRulesForPolicy,
  updateRule,
  deleteRule,
};
