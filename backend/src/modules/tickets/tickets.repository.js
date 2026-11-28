const db = require('../../config/db');

const findAssignableStaff = async (staffId, societyId) => {
  const result = await db.query(
    `SELECT id, first_name, last_name FROM staff
      WHERE id = $1 AND society_id = $2 AND status = 'ACTIVE'`,
    [staffId, societyId],
  );
  return result.rows[0] || null;
};

const findStaffIdForUser = async (userId, societyId, employeeCode) => {
  const result = await db.query(
    `SELECT s.id
       FROM staff s
       LEFT JOIN security_guards g ON g.staff_id = s.id
       LEFT JOIN users u ON u.id = $1
      WHERE s.society_id = $2
        AND s.status = 'ACTIVE'
        AND (
          (g.user_id = $1 AND ($3::text IS NULL OR upper(s.employee_code) = upper($3)))
          OR (s.email IS NOT NULL AND lower(s.email) = lower(u.email))
        )
      ORDER BY CASE
        WHEN g.user_id = $1 AND ($3::text IS NULL OR upper(s.employee_code) = upper($3)) THEN 0
        ELSE 1
      END
      LIMIT 1`,
    [userId, societyId, employeeCode || null],
  );
  return result.rows[0] || null;
};

const listAssignedStaffTickets = async (staffId, userId) => {
  const result = await db.query(
    `SELECT t.id, t.ticket_no, t.subject, t.description, t.priority, t.status,
            t.opened_at, c.name AS category_name, ta.id AS assignment_id,
            concat_ws(' ', resident.first_name, resident.last_name) AS resident_name,
            resident.phone AS resident_phone,
            concat_ws(' / ', tower.name,
              COALESCE(NULLIF(floor.name, ''), floor.floor_number::text),
              unit.unit_number) AS flat_details,
            unit.unit_number
       FROM ticket_assignments ta
       JOIN tickets t ON t.id = ta.ticket_id
       LEFT JOIN ticket_categories c ON c.id = t.category_id
       LEFT JOIN users resident ON resident.id = t.raised_by
       LEFT JOIN units unit ON unit.id = t.unit_id
       LEFT JOIN floors floor ON floor.id = unit.floor_id
       LEFT JOIN towers tower ON tower.id = floor.tower_id
      WHERE ta.unassigned_at IS NULL
        AND (ta.assigned_staff_id = $1
             OR (ta.assigned_staff_id IS NULL AND ta.assigned_to_user_id = $2))
        AND t.status NOT IN ('RESOLVED', 'CLOSED')
      ORDER BY ta.assigned_at DESC`,
    [staffId, userId],
  );
  return result.rows;
};

const findActiveAssignmentForStaff = async (ticketId, staffId, userId) => {
  const result = await db.query(
    `SELECT * FROM ticket_assignments
      WHERE ticket_id = $1 AND unassigned_at IS NULL
        AND (assigned_staff_id = $2
             OR (assigned_staff_id IS NULL AND assigned_to_user_id = $3))
      ORDER BY assigned_at DESC LIMIT 1`,
    [ticketId, staffId, userId],
  );
  return result.rows[0] || null;
};

const findStaffUserId = async (staffId) => {
  const result = await db.query(
    `SELECT linked.user_id
       FROM (
         SELECT g.user_id, 0 AS priority
           FROM security_guards g
          WHERE g.staff_id = $1 AND g.status = 'ACTIVE' AND g.user_id IS NOT NULL
         UNION ALL
         SELECT u.id AS user_id, 1 AS priority
           FROM staff s
           JOIN users u ON lower(u.email) = lower(s.email)
                        AND u.society_id = s.society_id
          WHERE s.id = $1 AND s.email IS NOT NULL AND u.status = 'ACTIVE'
       ) linked
      ORDER BY priority
      LIMIT 1`,
    [staffId],
  );
  return result.rows[0]?.user_id || null;
};

// --- tickets ------------------------------------------------------------------

const createTicket = async ({ societyId, ticketNo, categoryId, raisedBy, unitId, subject, description, priority }) => {
  const result = await db.query(
    `INSERT INTO tickets (society_id, ticket_no, category_id, raised_by, unit_id, subject, description, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [societyId, ticketNo, categoryId, raisedBy, unitId || null, subject, description || null, priority]
  );
  return result.rows[0];
};

const findByTicketNo = async (ticketNo) => {
  const result = await db.query('SELECT * FROM tickets WHERE ticket_no = $1', [ticketNo]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * vendorId (when provided) scopes results to tickets that have at least
 * one assignment to that vendor - used for a VENDOR-only login (same
 * row-level scoping pattern as Phase 8's vendors fix).
 */
const listTickets = async ({ societyId, status, categoryId, priority, raisedBy, unitId, vendorId }) => {
  const conditions = [];
  const params = [];
  let idx = 1;
  let joinClause = '';

  if (vendorId) {
    joinClause = 'JOIN ticket_assignments ta ON ta.ticket_id = tickets.id AND ta.assigned_vendor_id = $' + idx++ + ' AND ta.unassigned_at IS NULL JOIN vendors scope_vendor ON scope_vendor.id = ta.assigned_vendor_id AND scope_vendor.society_id = tickets.society_id';
    params.push(vendorId);
  }
  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (categoryId) {
    conditions.push(`category_id = $${idx++}`);
    params.push(categoryId);
  }
  if (priority) {
    conditions.push(`priority = $${idx++}`);
    params.push(priority);
  }
  if (raisedBy) {
    conditions.push(`raised_by = $${idx++}`);
    params.push(raisedBy);
  }
  if (unitId) {
    conditions.push(`unit_id = $${idx++}`);
    params.push(unitId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT DISTINCT tickets.* FROM tickets ${joinClause} ${whereClause} ORDER BY opened_at DESC`,
    params
  );
  return result.rows;
};

const updateStatus = async (id, status, timestamps = {}) => {
  const result = await db.query(
    `UPDATE tickets SET
       status       = $2,
       resolved_at  = COALESCE($3, resolved_at),
       closed_at    = COALESCE($4, closed_at),
       updated_at   = now()
     WHERE id = $1
     RETURNING *`,
    [id, status, timestamps.resolvedAt || null, timestamps.closedAt || null]
  );
  return result.rows[0] || null;
};

const updateTicket = async (id, { subject, description, priority }) => {
  const result = await db.query(
    `UPDATE tickets SET
       subject      = COALESCE($2, subject),
       description  = COALESCE($3, description),
       priority     = COALESCE($4, priority),
       updated_at   = now()
     WHERE id = $1
     RETURNING *`,
    [id, subject, description, priority]
  );
  return result.rows[0] || null;
};

const deleteTicket = async (id) => {
  const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- ticket_assignments ---------------------------------------------------------

const createAssignment = async ({ ticketId, assignedToUserId, assignedToStaffId, assignedVendorId }) => {
  const result = await db.query(
    `INSERT INTO ticket_assignments (ticket_id, assigned_to_user_id, assigned_staff_id, assigned_vendor_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, assignedToUserId || null, assignedToStaffId || null, assignedVendorId || null]
  );
  return result.rows[0];
};

const findActiveAssignment = async (ticketId) => {
  const result = await db.query(
    'SELECT * FROM ticket_assignments WHERE ticket_id = $1 AND unassigned_at IS NULL ORDER BY assigned_at DESC LIMIT 1',
    [ticketId]
  );
  return result.rows[0] || null;
};

const listAssignments = async (ticketId, vendorId) => {
  const result = await db.query(
    `SELECT ta.*, s.first_name AS assigned_staff_first_name,
            s.last_name AS assigned_staff_last_name,
            s.employee_code AS assigned_staff_employee_code,
            s.staff_type AS assigned_staff_type
       FROM ticket_assignments ta
       LEFT JOIN staff s ON s.id = ta.assigned_staff_id
      WHERE ta.ticket_id = $1 ${vendorId ? 'AND ta.assigned_vendor_id = $2' : ''}
      ORDER BY ta.assigned_at DESC`,
    vendorId ? [ticketId, vendorId] : [ticketId]
  );
  return result.rows;
};

const unassign = async (id) => {
  const result = await db.query(
    'UPDATE ticket_assignments SET unassigned_at = now() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

// --- ticket_comments -----------------------------------------------------------

const addComment = async ({ ticketId, authorId, comment, isInternal }) => {
  const result = await db.query(
    `INSERT INTO ticket_comments (ticket_id, author_id, comment, is_internal)
     VALUES ($1, $2, $3, COALESCE($4, false))
     RETURNING *`,
    [ticketId, authorId, comment, isInternal]
  );
  return result.rows[0];
};

const listComments = async (ticketId, includeInternal) => {
  const filter = includeInternal ? '' : 'AND is_internal = false';
  const result = await db.query(
    `SELECT * FROM ticket_comments WHERE ticket_id = $1 ${filter} ORDER BY created_at ASC`,
    [ticketId]
  );
  return result.rows;
};

// --- ticket_attachments -----------------------------------------------------------

const addAttachment = async ({ ticketId, documentId }) => {
  const result = await db.query(
    `INSERT INTO ticket_attachments (ticket_id, document_id)
     VALUES ($1, $2)
     RETURNING *`,
    [ticketId, documentId || null]
  );
  return result.rows[0];
};

const listAttachments = async (ticketId) => {
  const result = await db.query(
    `SELECT ta.*, d.title AS document_title, d.file_name AS document_file_name
     FROM ticket_attachments ta
     LEFT JOIN documents d ON d.id = ta.document_id
     WHERE ta.ticket_id = $1
     ORDER BY ta.created_at ASC`,
    [ticketId]
  );
  return result.rows;
};

const deleteAttachment = async (ticketId, attachmentId) => {
  const result = await db.query(
    'DELETE FROM ticket_attachments WHERE ticket_id = $1 AND id = $2 RETURNING id',
    [ticketId, attachmentId]
  );
  return result.rows[0] || null;
};

// --- ticket_status_history ---------------------------------------------------------

const addStatusHistory = async ({ ticketId, oldStatus, newStatus, changedBy, remarks }) => {
  const result = await db.query(
    `INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, remarks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [ticketId, oldStatus || null, newStatus, changedBy || null, remarks || null]
  );
  return result.rows[0];
};

const listStatusHistory = async (ticketId) => {
  const result = await db.query(
    'SELECT * FROM ticket_status_history WHERE ticket_id = $1 ORDER BY changed_at ASC',
    [ticketId]
  );
  return result.rows;
};

// --- ticket_ratings ------------------------------------------------------------------

const findRatingByTicketId = async (ticketId) => {
  const result = await db.query('SELECT * FROM ticket_ratings WHERE ticket_id = $1', [ticketId]);
  return result.rows[0] || null;
};

const addRating = async ({ ticketId, ratedBy, rating, comment }) => {
  const result = await db.query(
    `INSERT INTO ticket_ratings (ticket_id, rated_by, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, ratedBy, rating, comment || null]
  );
  return result.rows[0];
};

module.exports = {
  findAssignableStaff,
  findStaffIdForUser,
  listAssignedStaffTickets,
  findActiveAssignmentForStaff,
  findStaffUserId,
  createTicket,
  findByTicketNo,
  findById,
  listTickets,
  updateStatus,
  updateTicket,
  deleteTicket,
  createAssignment,
  findActiveAssignment,
  listAssignments,
  unassign,
  addComment,
  listComments,
  addAttachment,
  listAttachments,
  deleteAttachment,
  addStatusHistory,
  listStatusHistory,
  findRatingByTicketId,
  addRating,
};
