const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');
const parseDuration = require('../../common/parseDuration');
const ApiError = require('../../common/ApiError');
const authRepository = require('./auth.repository');
const db = require('../../config/db');
const usersRepository = require('../users/users.repository');
const rbacRepository = require('../rbac/rbac.repository');
const emailProvider = require('../notifications/providers/email.provider');
const Notification = require('../notifications/notification/notification.model');
const {
  FaceVerificationError,
  verifySecurityGuardFace,
} = require('./securityFaceVerification');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const hashPasswordResetOtp = (userId, otp) => crypto
  .createHmac('sha256', env.jwt.accessSecret)
  .update(`${userId}:${otp}`)
  .digest('hex');
const generateAccessToken = (user) =>
  jwt.sign({ sub: user.id }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
const generateRandomToken = () => crypto.randomBytes(48).toString('hex');
const hasValidSecuritySelfie = (mimeType, encodedImage) => {
  const image = Buffer.from(encodedImage, 'base64');
  try {
    if (image.length < 16 || image.length > 1_500_000) return false;
    if (mimeType === 'image/jpeg') {
      return image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
    }
    if (mimeType === 'image/png') {
      return image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    return false;
  } finally {
    image.fill(0);
  }
};

const notifyAdminsOfResidentPasswordUpdate = async (userId, action) => {
  try {
    const recipients = await authRepository.findResidentPasswordNotificationRecipients(userId);
    if (!recipients.length) return;
    const isReset = action === 'reset';
    const eventId = crypto.randomBytes(16).toString('hex');
    const changedAt = new Date().toISOString();
    await Notification.bulkCreate(recipients.map((recipient) => ({
      societyId: recipient.society_id,
      userId: recipient.user_id,
      channel: 'IN_APP',
      notificationType: 'OPERATIONAL',
      title: isReset ? 'Resident password reset' : 'Resident password changed',
      subject: isReset ? 'Resident password reset' : 'Resident password changed',
      message: `${recipient.resident_name || 'A resident'} ${isReset ? 'reset' : 'changed'} their account password.`,
      data: { eventId, residentId: recipient.resident_id, action, changedAt },
      referenceType: 'RESIDENT_PASSWORD',
      referenceId: recipient.resident_id,
      priority: 'MEDIUM',
    })));
  } catch (error) {
    // The password update has already succeeded. A notification failure must
    // not report the credential change itself as failed to the resident.
    console.error('Could not notify society administrators about resident password update:', error.message);
  }
};

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

const login = async ({ email, password, securityCode, selfieData, selfieMimeType }, meta = {}) => {
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

  let authenticatedUser = user;
  const securityHeadRole = await db.query(
    `SELECT 1
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1
       AND r.code = 'SECURITY_HEAD'
       AND (ur.society_id IS NULL OR ur.society_id = $2)
     LIMIT 1`,
    [user.id, user.society_id]
  );

  if (securityCode !== undefined) {
    if (!securityHeadRole.rowCount) {
      await authRepository.createLoginHistory({
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.deviceInfo,
        success: false,
        failureReason: 'NOT_SECURITY_ACCOUNT',
      });
      throw new ApiError(401, 'Invalid security login credentials or employee code');
    }

    const guardResult = await db.query(
      `SELECT u.*,
              s.employee_code AS guard_employee_code,
              COALESCE(NULLIF(s.photo_path, ''), NULLIF(u.profile_picture_url, '')) AS profile_picture_url
       FROM security_guards sg
       JOIN staff s ON s.id = sg.staff_id
       JOIN users u ON u.id = sg.user_id
       WHERE upper(s.employee_code) = upper($1)
         AND s.society_id = $2
         AND s.staff_type = 'SECURITY_GUARD'
         AND s.status = 'ACTIVE'
         AND sg.status = 'ACTIVE'
         AND u.status = 'ACTIVE'
       LIMIT 1`,
      // Shared guard credentials authenticate the security login account;
      // the employee code selects the specific guard and profile photo.
      [securityCode.trim(), user.society_id]
    );
    if (!guardResult.rowCount) {
      await authRepository.createLoginHistory({
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.deviceInfo,
        success: false,
        failureReason: 'INVALID_SECURITY_CODE',
      });
      throw new ApiError(401, 'Invalid security login credentials or employee code');
    }
    if (!hasValidSecuritySelfie(selfieMimeType, selfieData)) {
      await authRepository.createLoginHistory({
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.deviceInfo,
        success: false,
        failureReason: 'INVALID_SECURITY_SELFIE',
      });
      throw new ApiError(400, 'Take a valid selfie before signing in as a guard.');
    }
    const guardUser = guardResult.rows[0];
    const selfieBytes = Buffer.from(selfieData, 'base64');
    selfieData = undefined;
    try {
      await verifySecurityGuardFace({
        selfieBytes,
        selfieMimeType,
        profilePictureUrl: guardUser.profile_picture_url,
      });
    } catch (error) {
      if (!(error instanceof FaceVerificationError)) throw error;
      await authRepository.createLoginHistory({
        userId: guardUser.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.deviceInfo,
        success: false,
        failureReason: error.code,
      });
      throw new ApiError(error.statusCode, error.message);
    } finally {
      selfieBytes.fill(0);
    }
    authenticatedUser = guardUser;
  } else if (securityHeadRole.rowCount) {
    await authRepository.createLoginHistory({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.deviceInfo,
      success: false,
      failureReason: 'SECURITY_EMPLOYEE_CODE_REQUIRED',
    });
    throw new ApiError(
      403,
      'Use Security guard login and enter your employee code to sign in.',
    );
  }

  const tokens = await issueTokens(authenticatedUser, meta);
  await usersRepository.updateLastLogin(authenticatedUser.id);
  await authRepository.createLoginHistory({
    userId: authenticatedUser.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.deviceInfo,
    success: true,
  });

  const [roles, permissions] = await Promise.all([
    rbacRepository.getUserRoles(authenticatedUser.id, authenticatedUser.society_id),
    rbacRepository.getUserPermissions(authenticatedUser.id, authenticatedUser.society_id),
  ]);

  return {
    ...tokens,
    user: {
      ...sanitizeUser(authenticatedUser),
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
  await notifyAdminsOfResidentPasswordUpdate(userId, 'change');
};

const requestResidentPasswordResetOtp = async (email) => {
  const user = await authRepository.findResidentByEmail(email.trim().toLowerCase());
  // Same response for unknown, inactive, and non-resident accounts prevents
  // this public endpoint from becoming an account enumeration oracle.
  if (!user) return { message: 'If this email belongs to a resident account, a verification code will be sent.' };
  if (await authRepository.hasRecentPasswordResetRequest(user.id)) {
    return { message: 'If this email belongs to a resident account, a verification code will be sent.' };
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  const tokenHash = hashPasswordResetOtp(user.id, otp);
  const expiresAt = new Date(Date.now() + parseDuration('10m'));
  await authRepository.revokeActivePasswordResetTokens(user.id);
  await authRepository.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

  try {
    await emailProvider.sendEmail({
      email: user.email,
      userId: user.id,
      subject: 'Your Housing Society password reset code',
      title: 'Password reset code',
      message: `Your password reset verification code is ${otp}. It expires in 10 minutes and can only be used once. If you did not request this code, ignore this email.`,
    });
  } catch (error) {
    await authRepository.revokeActivePasswordResetTokens(user.id);
    console.error('Password reset email delivery failed:', error.message);
    throw new ApiError(503, 'We could not send the verification code. Please try again later.');
  }
  return {
    message: 'If this email belongs to a resident account, a verification code will be sent.',
  };
};

const resetResidentPasswordWithOtp = async ({ email, otp, newPassword }) => {
  const user = await authRepository.findResidentByEmail(email.trim().toLowerCase());
  if (!user) throw new ApiError(400, 'The code is invalid or has expired. Request a new code and try again.');
  const tokenHash = hashPasswordResetOtp(user.id, otp);
  const record = await authRepository.findPasswordResetToken(tokenHash);
  if (!record || record.user_id !== user.id || record.used_at || new Date(record.expires_at) < new Date() || record.attempts >= 5) {
    if (!record) await authRepository.incrementActivePasswordResetAttempts(user.id);
    throw new ApiError(400, 'The code is invalid or has expired. Request a new code and try again.');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  if (!await authRepository.completePasswordReset({
    tokenId: record.id,
    userId: user.id,
    passwordHash,
  })) {
    throw new ApiError(400, 'The code is invalid or has expired. Request a new code and try again.');
  }
  await notifyAdminsOfResidentPasswordUpdate(user.id, 'reset');
};

const requestAdminPasswordResetOtp = async (email) => {
  const user = await authRepository.findAdminByEmail(email.trim().toLowerCase());
  const genericMessage = 'If this email belongs to an admin account, a verification code will be sent.';
  if (!user || await authRepository.hasRecentPasswordResetRequest(user.id)) return { message: genericMessage };

  const otp = String(crypto.randomInt(100000, 1000000));
  const tokenHash = hashPasswordResetOtp(user.id, otp);
  const expiresAt = new Date(Date.now() + parseDuration('10m'));
  await authRepository.revokeActivePasswordResetTokens(user.id);
  await authRepository.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });
  try {
    await emailProvider.sendEmail({
      email: user.email,
      userId: user.id,
      subject: 'Your Housing Society admin password reset code',
      title: 'Password reset code',
      message: `Your admin password reset verification code is ${otp}. It expires in 10 minutes and can only be used once. If you did not request this code, ignore this email.`,
    });
  } catch (error) {
    await authRepository.revokeActivePasswordResetTokens(user.id);
    console.error('Admin password reset email delivery failed:', error.message);
    throw new ApiError(503, 'We could not send the verification code. Please try again later.');
  }
  return { message: genericMessage };
};

const resetAdminPasswordWithOtp = async ({ email, otp, newPassword }) => {
  const user = await authRepository.findAdminByEmail(email.trim().toLowerCase());
  if (!user) throw new ApiError(400, 'The code is invalid or has expired. Request a new code and try again.');
  const tokenHash = hashPasswordResetOtp(user.id, otp);
  const record = await authRepository.findPasswordResetToken(tokenHash);
  if (!record || record.user_id !== user.id || record.used_at || new Date(record.expires_at) < new Date() || record.attempts >= 5) {
    if (!record) await authRepository.incrementActivePasswordResetAttempts(user.id);
    throw new ApiError(400, 'The code is invalid or has expired. Request a new code and try again.');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  if (!await authRepository.completePasswordReset({ tokenId: record.id, userId: user.id, passwordHash })) {
    throw new ApiError(400, 'The code is invalid or has expired. Request a new code and try again.');
  }
};

// Keep the existing web/admin reset token API compatible. The resident app
// uses the dedicated OTP endpoints above.
const forgotPassword = async (email) => {
  const user = await usersRepository.findByEmail(email.toLowerCase());
  if (!user) throw new ApiError(404, 'No account was found with this email address. Check the email and try again.');
  const rawToken = generateRandomToken();
  const expiresAt = new Date(Date.now() + parseDuration('30m'));
  await authRepository.createPasswordResetToken({ userId: user.id, tokenHash: hashToken(rawToken), expiresAt });
  try {
    await emailProvider.sendEmail({
      email: user.email,
      userId: user.id,
      subject: 'Your Housing Society password reset token',
      title: 'Password reset token',
      message: `Use this reset token in the app: ${rawToken}\n\nIt expires in 30 minutes and can only be used once. If you did not request a password reset, ignore this email.`,
    });
  } catch (error) {
    console.error('Password reset email delivery failed:', error.message);
    throw new ApiError(503, 'We could not send the password reset email. Please try again later.');
  }
  return { message: 'Reset instructions were sent to your email.' };
};

const resetPassword = async ({ token, newPassword }) => {
  const record = await authRepository.findPasswordResetToken(hashToken(token));
  if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  if (!await authRepository.completePasswordReset({ tokenId: record.id, userId: record.user_id, passwordHash })) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }
  await notifyAdminsOfResidentPasswordUpdate(record.user_id, 'reset');
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
  requestResidentPasswordResetOtp,
  resetResidentPasswordWithOtp,
  requestAdminPasswordResetOtp,
  resetAdminPasswordWithOtp,
};
