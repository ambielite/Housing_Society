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
const RESIDENT_ROLE_CODES = new Set(['RESIDENT_APP', 'RESIDENT']);
const isResidentOnly = (roles) => roles.length > 0
  && roles.every((role) => RESIDENT_ROLE_CODES.has(role.code));
const hashPasswordResetOtp = (userId, otp) => crypto
  .createHmac('sha256', env.jwt.accessSecret)
  .update(`${userId}:${otp}`)
  .digest('hex');
const generateAccessToken = (user) =>
  jwt.sign({
    sub: user.id,
    ...(user.guard_employee_code ? { guardEmployeeCode: user.guard_employee_code } : {}),
  }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
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
    deviceInfo: JSON.stringify({
      userAgent: String(meta.deviceInfo || '').slice(0, 140) || null,
      clientType: meta.clientType || 'web',
      ...(user.guard_employee_code ? { guardEmployeeCode: user.guard_employee_code } : {}),
    }),
    ipAddress: meta.ipAddress,
  });

  return { accessToken, refreshToken };
};

const login = async ({ email, password, securityCode, selfieData, selfieMimeType, clientType = 'web' }, meta = {}) => {
  const user = await usersRepository.findByEmail(email.toLowerCase());

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const submittedGuardCode = securityCode === undefined ? null : String(securityCode).trim();
  let guardHistoryIdentity = { staffId: null, employeeCode: submittedGuardCode };
  if (submittedGuardCode) {
    const guardIdentity = await db.query(
      `SELECT staff_member.id AS staff_id, staff_member.employee_code
         FROM security_guards guard
         JOIN staff staff_member ON staff_member.id = guard.staff_id
        WHERE guard.user_id = $1
          AND staff_member.society_id = $2
          AND staff_member.staff_type = 'SECURITY_GUARD'
          AND upper(staff_member.employee_code) = upper($3)
        LIMIT 1`,
      [user.id, user.society_id, submittedGuardCode]
    );
    if (guardIdentity.rowCount) {
      guardHistoryIdentity = {
        staffId: guardIdentity.rows[0].staff_id,
        employeeCode: guardIdentity.rows[0].employee_code,
      };
    }
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    await authRepository.createLoginHistory({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.deviceInfo,
      success: false,
      failureReason: 'INVALID_PASSWORD',
      ...guardHistoryIdentity,
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
      ...guardHistoryIdentity,
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
        ...guardHistoryIdentity,
      });
      throw new ApiError(401, 'Invalid security login credentials or employee code');
    }

    const guardResult = await db.query(
      `SELECT u.*,
              s.employee_code AS guard_employee_code,
              s.first_name AS guard_first_name,
              s.last_name AS guard_last_name,
              s.mobile_number AS guard_phone,
              NULLIF(s.photo_path, '') AS guard_profile_picture_url,
              s.id AS guard_staff_id
       FROM security_guards sg
       JOIN staff s ON s.id = sg.staff_id
       JOIN users u ON u.id = sg.user_id
       WHERE upper(s.employee_code) = upper($1)
         AND sg.user_id = $3
         AND s.society_id = $2
         AND s.staff_type = 'SECURITY_GUARD'
         AND s.status = 'ACTIVE'
         AND sg.status = 'ACTIVE'
         AND u.status = 'ACTIVE'
       LIMIT 1`,
      // Shared guard credentials authenticate the security login account;
      // the employee code selects the specific guard and profile photo.
      [securityCode.trim(), user.society_id, user.id]
    );
    if (!guardResult.rowCount) {
      await authRepository.createLoginHistory({
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.deviceInfo,
        success: false,
        failureReason: 'INVALID_SECURITY_CODE',
        ...guardHistoryIdentity,
      });
      throw new ApiError(401, 'Invalid security login credentials or employee code');
    }
    const guardUser = guardResult.rows[0];
    if (!hasValidSecuritySelfie(selfieMimeType, selfieData)) {
      await authRepository.createLoginHistory({
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.deviceInfo,
        success: false,
        failureReason: 'INVALID_SECURITY_SELFIE',
        staffId: guardUser.guard_staff_id,
        employeeCode: guardUser.guard_employee_code,
      });
      throw new ApiError(400, 'Take a valid selfie before signing in as a guard.');
    }
    const selfieBytes = Buffer.from(selfieData, 'base64');
    selfieData = undefined;
    try {
      await verifySecurityGuardFace({
        selfieBytes,
        selfieMimeType,
        profilePictureUrl: guardUser.guard_profile_picture_url,
      });
    } catch (error) {
      if (!(error instanceof FaceVerificationError)) throw error;
      await authRepository.createLoginHistory({
        userId: guardUser.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.deviceInfo,
        success: false,
        failureReason: error.code,
        staffId: guardUser.guard_staff_id,
        employeeCode: guardUser.guard_employee_code,
      });
      throw new ApiError(error.statusCode, error.message);
    } finally {
      selfieBytes.fill(0);
    }
    // Keep shared login credentials, but return the individual guard's staff
    // profile so one guard never inherits another guard's name, phone, or photo.
    authenticatedUser = {
      ...guardUser,
      first_name: guardUser.guard_first_name,
      last_name: guardUser.guard_last_name,
      phone: guardUser.guard_phone,
      profile_picture_url: guardUser.guard_profile_picture_url,
      guard_staff_id: guardUser.guard_staff_id,
    };
  } else if (securityHeadRole.rowCount) {
    await authRepository.createLoginHistory({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.deviceInfo,
      success: false,
      failureReason: 'SECURITY_EMPLOYEE_CODE_REQUIRED',
      ...guardHistoryIdentity,
    });
    throw new ApiError(
      403,
      'Use Security guard login and enter your employee code to sign in.',
    );
  }

  const roles = await rbacRepository.getUserRoles(authenticatedUser.id, authenticatedUser.society_id);
  if (clientType !== 'resident_app' && isResidentOnly(roles)) {
    await authRepository.createLoginHistory({
      userId: authenticatedUser.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.deviceInfo,
      success: false,
      failureReason: 'RESIDENT_WEB_LOGIN_BLOCKED',
    });
    throw new ApiError(403, 'Resident accounts can sign in only through the resident app.');
  }

  const tokens = await issueTokens(authenticatedUser, { ...meta, clientType });
  await usersRepository.updateLastLogin(authenticatedUser.id);
  await authRepository.createLoginHistory({
    userId: authenticatedUser.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.deviceInfo,
    success: true,
    staffId: authenticatedUser.guard_staff_id,
    employeeCode: authenticatedUser.guard_employee_code,
  });

  const permissions = await rbacRepository.getUserPermissions(authenticatedUser.id, authenticatedUser.society_id);

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

  let user = await usersRepository.findById(existing.user_id);
  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'User account is not active');
  }

  // Preserve the employee-specific identity across token rotation. Older
  // refresh records contain a plain user-agent string and remain compatible.
  let refreshContext = {};
  try {
    refreshContext = JSON.parse(existing.device_info || '{}');
  } catch (_) {
    refreshContext = {};
  }
  if (refreshContext.guardEmployeeCode) {
    const guardResult = await db.query(
      `SELECT s.employee_code AS guard_employee_code
         FROM security_guards sg
         JOIN staff s ON s.id = sg.staff_id
        WHERE sg.user_id = $1
          AND s.society_id = $2
          AND upper(s.employee_code) = upper($3)
          AND s.staff_type = 'SECURITY_GUARD'
          AND s.status = 'ACTIVE'
          AND sg.status = 'ACTIVE'
        LIMIT 1`,
      [user.id, user.society_id, refreshContext.guardEmployeeCode]
    );
    if (!guardResult.rowCount) {
      throw new ApiError(401, 'This security staff profile is no longer active.');
    }
    user = { ...user, guard_employee_code: guardResult.rows[0].guard_employee_code };
  }

  const clientType = refreshContext.clientType || 'web';
  const roles = await rbacRepository.getUserRoles(user.id, user.society_id);
  if (clientType !== 'resident_app' && isResidentOnly(roles)) {
    await authRepository.revokeRefreshToken(tokenHash);
    throw new ApiError(403, 'Resident accounts can sign in only through the resident app.');
  }

  // Rotation: revoke the used token, then issue a brand new pair.
  await authRepository.revokeRefreshToken(tokenHash);
  return issueTokens(user, {
    deviceInfo: refreshContext.guardEmployeeCode
      ? refreshContext.userAgent
      : existing.device_info,
    clientType,
  });
};

const logout = async ({ refreshToken }) => {
  const tokenHash = hashToken(refreshToken);
  const existing = await authRepository.findRefreshToken(tokenHash);
  await authRepository.revokeRefreshToken(tokenHash);
  if (existing) {
    let refreshContext = {};
    try {
      refreshContext = JSON.parse(existing.device_info || '{}');
    } catch (_) {
      refreshContext = {};
    }
    await authRepository.closeOpenLoginHistory(existing.user_id, refreshContext.guardEmployeeCode || null);
  }
};

const logoutAll = async (userId) => {
  await authRepository.revokeAllUserRefreshTokens(userId);
  await authRepository.closeOpenLoginHistory(userId);
};

const getProfile = async (userId, societyId, guardEmployeeCode = null) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (guardEmployeeCode) {
    const guardResult = await db.query(
      `SELECT s.employee_code AS guard_employee_code,
              s.first_name, s.last_name, s.mobile_number AS phone,
              NULLIF(s.photo_path, '') AS profile_picture_url
         FROM security_guards sg
         JOIN staff s ON s.id = sg.staff_id
        WHERE sg.user_id = $1
          AND s.society_id = $2
          AND upper(s.employee_code) = upper($3)
          AND s.staff_type = 'SECURITY_GUARD'
          AND s.status = 'ACTIVE'
          AND sg.status = 'ACTIVE'
        LIMIT 1`,
      [userId, societyId, guardEmployeeCode]
    );
    if (!guardResult.rowCount) {
      throw new ApiError(404, 'No active security staff profile is linked to this account');
    }
    Object.assign(user, guardResult.rows[0]);
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
