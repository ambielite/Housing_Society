const db = require('../../config/db');

// --- refresh_tokens ------------------------------------------------------

const saveRefreshToken = async ({ userId, tokenHash, expiresAt, deviceInfo, ipAddress }) => {
  const result = await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, tokenHash, expiresAt, deviceInfo || null, ipAddress || null]
  );
  return result.rows[0];
};

const findRefreshToken = async (tokenHash) => {
  const result = await db.query('SELECT * FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  return result.rows[0] || null;
};

const revokeRefreshToken = async (tokenHash) => {
  await db.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash]
  );
};

const revokeAllUserRefreshTokens = async (userId) => {
  await db.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
};

// --- login_history ---------------------------------------------------------

const createLoginHistory = async ({ userId, ipAddress, userAgent, success, failureReason }) => {
  const result = await db.query(
    `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, ipAddress || null, userAgent || null, success, failureReason || null]
  );
  return result.rows[0];
};

const closeOpenLoginHistory = async (userId) => {
  await db.query(
    `UPDATE login_history SET logout_at = now()
     WHERE id = (
       SELECT id FROM login_history
       WHERE user_id = $1 AND success = true AND logout_at IS NULL
       ORDER BY login_at DESC
       LIMIT 1
     )`,
    [userId]
  );
};

const listLoginHistory = async (userId) => {
  const result = await db.query(
    'SELECT * FROM login_history WHERE user_id = $1 ORDER BY login_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
};

// --- password_reset_tokens --------------------------------------------------

const createPasswordResetToken = async ({ userId, tokenHash, expiresAt }) => {
  const result = await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
};

const findResidentByEmail = async (email) => {
  const result = await db.query(
    `SELECT u.* FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE lower(u.email) = lower($1) AND u.status = 'ACTIVE'
       AND r.code = 'RESIDENT_APP'
       AND (ur.society_id IS NULL OR ur.society_id = u.society_id)
     LIMIT 1`,
    [String(email).trim()]
  );
  return result.rows[0] || null;
};

const findResidentPasswordNotificationRecipients = async (userId) => {
  const result = await db.query(
    `SELECT DISTINCT res.society_id,
           res.id AS resident_id,
           admin.id AS user_id,
           COALESCE(NULLIF(res.display_name, ''), concat_ws(' ', res.first_name, res.last_name)) AS resident_name
     FROM residents res
     JOIN users admin ON admin.status = 'ACTIVE'
     JOIN user_roles ur ON ur.user_id = admin.id
     JOIN roles r ON r.id = ur.role_id
     WHERE res.user_id = $1
       AND admin.id <> $1
       AND r.status = 'ACTIVE'
       AND r.code IN ('SOCIETY_ADMIN', 'SUPER_ADMIN', 'PRESIDENT_SECRETARY')
       AND (ur.society_id = res.society_id OR (r.code = 'SUPER_ADMIN' AND ur.society_id IS NULL))`,
    [userId]
  );
  return result.rows;
};

const revokeActivePasswordResetTokens = async (userId) => {
  await db.query(
    'UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL',
    [userId]
  );
};

const hasRecentPasswordResetRequest = async (userId) => {
  const result = await db.query(
    `SELECT 1 FROM password_reset_tokens
     WHERE user_id = $1 AND created_at > now() - interval '60 seconds'
     LIMIT 1`,
    [userId]
  );
  return result.rowCount > 0;
};

const findPasswordResetToken = async (tokenHash) => {
  const result = await db.query('SELECT * FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
  return result.rows[0] || null;
};

const completePasswordReset = async ({ tokenId, userId, passwordHash }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const used = await client.query(
      `UPDATE password_reset_tokens SET used_at = now()
       WHERE id = $1 AND user_id = $2 AND used_at IS NULL
         AND expires_at > now() AND attempts < 5
       RETURNING id`,
      [tokenId, userId]
    );
    if (!used.rowCount) {
      await client.query('ROLLBACK');
      return false;
    }
    await client.query(
      'UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1',
      [userId, passwordHash]
    );
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const incrementActivePasswordResetAttempts = async (userId) => {
  await db.query(
    `UPDATE password_reset_tokens
     SET attempts = attempts + 1,
         used_at = CASE WHEN attempts + 1 >= 5 THEN now() ELSE used_at END
     WHERE id = (
       SELECT id FROM password_reset_tokens
       WHERE user_id = $1 AND used_at IS NULL AND expires_at > now() AND attempts < 5
       ORDER BY created_at DESC LIMIT 1
     )`,
    [userId]
  );
};

module.exports = {
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  createLoginHistory,
  closeOpenLoginHistory,
  listLoginHistory,
  createPasswordResetToken,
  findResidentByEmail,
  findResidentPasswordNotificationRecipients,
  revokeActivePasswordResetTokens,
  hasRecentPasswordResetRequest,
  findPasswordResetToken,
  completePasswordReset,
  incrementActivePasswordResetAttempts,
};
