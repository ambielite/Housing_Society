const db = require('../../config/db');

// --- sla_timers ---------------------------------------------------------------

const createTimer = async ({ ticketId, slaPolicyId, responseDueAt, resolutionDueAt }) => {
  const result = await db.query(
    `INSERT INTO sla_timers (ticket_id, sla_policy_id, response_due_at, resolution_due_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, slaPolicyId, responseDueAt, resolutionDueAt]
  );
  return result.rows[0];
};

const findTimerByTicketId = async (ticketId) => {
  const result = await db.query('SELECT * FROM sla_timers WHERE ticket_id = $1', [ticketId]);
  return result.rows[0] || null;
};

const findTimerById = async (id) => {
  const result = await db.query('SELECT * FROM sla_timers WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const updateTimer = async (id, fields) => {
  const setClauses = [];
  const params = [id];
  let idx = 2;

  for (const [column, value] of Object.entries(fields)) {
    setClauses.push(`${column} = $${idx++}`);
    params.push(value);
  }

  const result = await db.query(
    `UPDATE sla_timers SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

const listBreachedRunningTimers = async () => {
  const result = await db.query(
    `SELECT * FROM sla_timers
     WHERE status IN ('RUNNING', 'PAUSED')
       AND resolution_due_at IS NOT NULL
       AND resolution_due_at < now()`
  );
  return result.rows;
};

// --- escalation_rules (read-only from here) -------------------------------------

const listRulesForPolicy = async (slaPolicyId) => {
  const result = await db.query(
    'SELECT * FROM escalation_rules WHERE sla_policy_id = $1 ORDER BY escalation_level ASC',
    [slaPolicyId]
  );
  return result.rows;
};

// --- ticket_escalations ------------------------------------------------------------

const findEscalation = async (ticketId, escalationRuleId) => {
  const result = await db.query(
    'SELECT * FROM ticket_escalations WHERE ticket_id = $1 AND escalation_rule_id = $2',
    [ticketId, escalationRuleId]
  );
  return result.rows[0] || null;
};

const createEscalation = async ({ ticketId, escalationRuleId, escalatedTo }) => {
  const result = await db.query(
    `INSERT INTO ticket_escalations (ticket_id, escalation_rule_id, escalated_to)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ticketId, escalationRuleId, escalatedTo || null]
  );
  return result.rows[0];
};

const findEscalationById = async (id) => {
  const result = await db.query('SELECT * FROM ticket_escalations WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listEscalationsForTicket = async (ticketId) => {
  const result = await db.query(
    'SELECT * FROM ticket_escalations WHERE ticket_id = $1 ORDER BY escalated_at DESC',
    [ticketId]
  );
  return result.rows;
};

const acknowledgeEscalation = async (id) => {
  const result = await db.query(
    `UPDATE ticket_escalations SET status = 'ACKNOWLEDGED', acknowledged_at = now() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

const resolveEscalation = async (id) => {
  const result = await db.query(
    `UPDATE ticket_escalations SET status = 'RESOLVED' WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createTimer,
  findTimerByTicketId,
  findTimerById,
  updateTimer,
  listBreachedRunningTimers,
  listRulesForPolicy,
  findEscalation,
  createEscalation,
  findEscalationById,
  listEscalationsForTicket,
  acknowledgeEscalation,
  resolveEscalation,
};
