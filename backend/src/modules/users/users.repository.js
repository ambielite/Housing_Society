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

const findNamesByIds = async (ids) => {
  if (!ids.length) return [];
  const result = await db.query(
    'SELECT id, first_name, last_name FROM users WHERE id = ANY($1::uuid[])',
    [ids]
  );
  return result.rows;
};

const listAccessibleSocieties = async (userId, isSuperAdmin = false) => {
  if (isSuperAdmin) {
    const result = await db.query('SELECT id, name FROM societies ORDER BY name, id');
    return result.rows;
  }

  const result = await db.query(
    `WITH accessible_societies AS (
       SELECT society_id AS id FROM users WHERE id = $1 AND society_id IS NOT NULL
       UNION
       SELECT usa.society_id AS id
       FROM user_society_access usa
       WHERE usa.user_id = $1
         AND usa.active_from <= now()
         AND (usa.active_until IS NULL OR usa.active_until > now())
       UNION
       SELECT msa.society_id AS id
       FROM multi_society_access msa
       WHERE msa.user_id = $1 AND msa.status = 'ACTIVE'
         AND msa.access_level = 'SOCIETY' AND msa.society_id IS NOT NULL
         AND (msa.start_date IS NULL OR msa.start_date <= CURRENT_DATE)
         AND (msa.end_date IS NULL OR msa.end_date >= CURRENT_DATE)
       UNION
       SELECT s.id
       FROM multi_society_access msa
       JOIN societies s ON (
         (msa.access_level = 'ORGANIZATION' AND s.organization_id = msa.organization_id)
         OR (msa.access_level = 'CLUSTER' AND s.cluster_id = msa.cluster_id)
       )
       WHERE msa.user_id = $1 AND msa.status = 'ACTIVE'
         AND (msa.start_date IS NULL OR msa.start_date <= CURRENT_DATE)
         AND (msa.end_date IS NULL OR msa.end_date >= CURRENT_DATE)
     )
     SELECT s.id, s.name
     FROM societies s JOIN accessible_societies a ON a.id = s.id
     ORDER BY s.name, s.id`,
    [userId]
  );
  return result.rows;
};

const hasSocietyAccess = async (userId, societyId) => {
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM users WHERE id = $1 AND society_id = $2
       UNION ALL
       SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.society_id IS NULL AND r.code = 'SUPER_ADMIN'
       UNION ALL
       SELECT 1 FROM user_society_access
       WHERE user_id = $1 AND society_id = $2
         AND active_from <= now() AND (active_until IS NULL OR active_until > now())
       UNION ALL
       SELECT 1 FROM multi_society_access
       WHERE user_id = $1 AND society_id = $2 AND access_level = 'SOCIETY'
         AND status = 'ACTIVE'
         AND (start_date IS NULL OR start_date <= CURRENT_DATE)
         AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       UNION ALL
       SELECT 1 FROM multi_society_access msa
       JOIN societies s ON (
         (msa.access_level = 'ORGANIZATION' AND s.organization_id = msa.organization_id)
         OR (msa.access_level = 'CLUSTER' AND s.cluster_id = msa.cluster_id)
       )
       WHERE msa.user_id = $1 AND s.id = $2 AND msa.status = 'ACTIVE'
         AND (msa.start_date IS NULL OR msa.start_date <= CURRENT_DATE)
         AND (msa.end_date IS NULL OR msa.end_date >= CURRENT_DATE)
     ) AS allowed`,
    [userId, societyId]
  );
  return result.rows[0]?.allowed === true;
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
    conditions.push(`(
      users.society_id = $${idx}
      OR EXISTS (
        SELECT 1 FROM user_society_access usa
        WHERE usa.user_id = users.id
          AND usa.society_id = $${idx}
          AND usa.active_from <= now()
          AND (usa.active_until IS NULL OR usa.active_until > now())
      )
    )`);
    params.push(societyId);
    idx += 1;
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
  findNamesByIds,
  listAccessibleSocieties,
  hasSocietyAccess,
  createUser,
  updateProfile,
  updateStatus,
  updatePassword,
  updateLastLogin,
  listUsers,
};
