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

const findPasswordResetToken = async (tokenHash) => {
  const result = await db.query('SELECT * FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
  return result.rows[0] || null;
};

const markPasswordResetTokenUsed = async (id) => {
  await db.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [id]);
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
  findPasswordResetToken,
  markPasswordResetTokenUsed,
};
