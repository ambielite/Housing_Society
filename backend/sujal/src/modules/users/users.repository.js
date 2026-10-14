const db = require('../../config/db');

const PUBLIC_COLUMNS = `
  id, society_id, email, phone, first_name, last_name,
  status, last_login_at, created_at, updated_at
`;

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createUser = async ({ societyId, email, phone, passwordHash, firstName, lastName, status }) => {
  const result = await db.query(
    `INSERT INTO users (society_id, email, phone, password_hash, first_name, last_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'ACTIVE'))
     RETURNING *`,
    [societyId || null, email, phone || null, passwordHash, firstName, lastName || null, status || null]
  );
  return result.rows[0];
};

const updateProfile = async (id, { firstName, lastName, phone, societyId }) => {
  const result = await db.query(
    `UPDATE users SET
       first_name = COALESCE($2, first_name),
       last_name  = COALESCE($3, last_name),
       phone      = COALESCE($4, phone),
       society_id = COALESCE($5, society_id),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, firstName, lastName, phone, societyId]
  );
  return result.rows[0] || null;
};

const updateStatus = async (id, status) => {
  const result = await db.query(
    `UPDATE users SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return result.rows[0] || null;
};

const updatePassword = async (id, passwordHash) => {
  await db.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [id, passwordHash]);
};

const updateLastLogin = async (id) => {
  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
};

const listUsers = async ({ societyId, status, search, limit, offset }) => {
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
  if (search) {
    conditions.push(`(email ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const dataResult = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM users ${whereClause}`, params);

  return { rows: dataResult.rows, total: countResult.rows[0].total };
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateProfile,
  updateStatus,
  updatePassword,
  updateLastLogin,
  listUsers,
};
