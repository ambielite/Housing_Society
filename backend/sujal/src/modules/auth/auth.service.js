const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');
const parseDuration = require('../../common/parseDuration');
const ApiError = require('../../common/ApiError');
const authRepository = require('./auth.repository');
const usersRepository = require('../users/users.repository');
const rbacRepository = require('../rbac/rbac.repository');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateAccessToken = (user) =>
  jwt.sign({ sub: user.id }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
const generateRandomToken = () => crypto.randomBytes(48).toString('hex');

const sanitizeUser = (user) => {
  const { password_hash, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
};

const register = async ({ email, password, firstName, lastName, phone, societyId }) => {
  const existing = await usersRepository.findByEmail(email.toLowerCase());
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await usersRepository.createUser({
    societyId,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    firstName,
    lastName,
    status: 'ACTIVE',
  });
  return sanitizeUser(user);
};

const issueTokens = async (user, meta = {}) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRandomToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDuration(env.jwt.refreshExpiresIn));

  await authRepository.saveRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    deviceInfo: meta.deviceInfo,
    ipAddress: meta.ipAddress,
  });

  return { accessToken, refreshToken };
};

const login = async ({ email, password }, meta = {}) => {
  const user = await usersRepository.findByEmail(email.toLowerCase());

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    await authRepository.createLoginHistory({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.deviceInfo,
      success: false,
      failureReason: 'INVALID_PASSWORD',
    });
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    await authRepository.createLoginHistory({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.deviceInfo,
      success: false,
      failureReason: `ACCOUNT_${user.status}`,
    });
    throw new ApiError(403, 'This account is not active');
  }

  const tokens = await issueTokens(user, meta);
  await usersRepository.updateLastLogin(user.id);
  await authRepository.createLoginHistory({
    userId: user.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.deviceInfo,
    success: true,
  });

  const [roles, permissions] = await Promise.all([
    rbacRepository.getUserRoles(user.id, user.society_id),
    rbacRepository.getUserPermissions(user.id, user.society_id),
  ]);

  return {
    ...tokens,
    user: {
      ...sanitizeUser(user),
      roles: roles.map((r) => r.code),
      permissions: permissions.map((p) => p.code),
    },
  };
};

const refresh = async ({ refreshToken }) => {
  const tokenHash = hashToken(refreshToken);
  const existing = await authRepository.findRefreshToken(tokenHash);

  if (!existing || existing.revoked_at || new Date(existing.expires_at) < new Date()) {
    throw new ApiError(401, 'Refresh token is invalid or has expired');
  }

  const user = await usersRepository.findById(existing.user_id);
  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'User account is not active');
  }

  // Rotation: revoke the used token, then issue a brand new pair.
  await authRepository.revokeRefreshToken(tokenHash);
  return issueTokens(user);
};

const logout = async ({ refreshToken }) => {
  const tokenHash = hashToken(refreshToken);
  const existing = await authRepository.findRefreshToken(tokenHash);
  await authRepository.revokeRefreshToken(tokenHash);
  if (existing) {
    await authRepository.closeOpenLoginHistory(existing.user_id);
  }
};

const logoutAll = async (userId) => {
  await authRepository.revokeAllUserRefreshTokens(userId);
  await authRepository.closeOpenLoginHistory(userId);
};

const getProfile = async (userId, societyId) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const [roles, permissions] = await Promise.all([
    rbacRepository.getUserRoles(user.id, societyId),
    rbacRepository.getUserPermissions(user.id, societyId),
  ]);
  return {
    ...sanitizeUser(user),
    roles: roles.map((r) => r.code),
    permissions: permissions.map((p) => p.code),
  };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await usersRepository.updatePassword(userId, passwordHash);
  await authRepository.revokeAllUserRefreshTokens(userId);
};

const forgotPassword = async (email) => {
  const user = await usersRepository.findByEmail(email.toLowerCase());
  if (!user) {
    // Never reveal whether an email is registered.
    return { message: 'If this email is registered, a reset link has been generated.' };
  }

  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + parseDuration('30m'));
  await authRepository.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

  // No email/WhatsApp provider is wired up yet (that's Phase 14 -
  // Notifications). The raw token is returned here in non-production
  // environments only, purely so you can test the full flow in Postman.
  return {
    message: 'If this email is registered, a reset link has been generated.',
    devResetToken: env.nodeEnv === 'production' ? undefined : rawToken,
  };
};

const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = hashToken(token);
  const record = await authRepository.findPasswordResetToken(tokenHash);
  if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await usersRepository.updatePassword(record.user_id, passwordHash);
  await authRepository.markPasswordResetTokenUsed(record.id);
  await authRepository.revokeAllUserRefreshTokens(record.user_id);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
