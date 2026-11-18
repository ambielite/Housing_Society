const bcrypt = require('bcryptjs');
const ApiError = require('../../common/ApiError');
const { getPagination } = require('../../common/pagination');
const repository = require('./users.repository');
const rbacRepository = require('../rbac/rbac.repository');
const authRepository = require('../auth/auth.repository');
const { saveProfilePicture, removeProfilePicture } = require('./profilePicture.storage');
const securityEvents = require('../gates/securityEvents');
const { formatAdminLabel, changedFieldLabels } = require('../security/staff/securityProfileNotifications');
const residentDashboardEvents = require('../resident-dashboard/residentDashboardEvents');

const sanitize = (user) => {
  const { password_hash, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
};

const listUsers = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await repository.listUsers({
    societyId: query.societyId,
    status: query.status,
    search: query.search,
    limit,
    offset,
  });

  return {
    users: rows,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
};

const listAccessibleSocieties = async (userId, isSuperAdmin) =>
  repository.listAccessibleSocieties(userId, isSuperAdmin);

const getUserById = async (id) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const roles = await rbacRepository.getUserRoles(id, user.society_id);
  return { ...sanitize(user), roles: roles.map((r) => r.code) };
};

const createUser = async ({ email, password, firstName, lastName, phone, societyId, status, profilePicture }) => {
  const existing = await repository.findByEmail(email.toLowerCase());
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const profilePictureUrl = profilePicture ? saveProfilePicture(profilePicture) : null;
  let user;
  try {
    user = await repository.createUser({
      societyId,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      firstName,
      lastName,
      status,
      profilePictureUrl,
    });
  } catch (error) {
    removeProfilePicture(profilePictureUrl);
    throw error;
  }
  return sanitize(user);
};

const updateProfile = async (id, payload, actor = null) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const { profilePicture, ...profileFields } = payload;
  if (profileFields.email !== undefined) {
    profileFields.email = profileFields.email.trim().toLowerCase();
    const existing = await repository.findByEmail(profileFields.email);
    if (existing && String(existing.id) !== String(id)) {
      throw new ApiError(409, 'A user with this email already exists');
    }
  }
  const profilePictureUrl = profilePicture ? saveProfilePicture(profilePicture) : null;
  let updated;
  try {
    const changed = {};
    for (const [field, storedField] of [
      ['email', 'email'],
      ['firstName', 'first_name'],
      ['lastName', 'last_name'],
      ['phone', 'phone'],
    ]) {
      if (
        profileFields[field] !== undefined &&
        String(profileFields[field] ?? '').trim() !== String(user[storedField] ?? '').trim()
      ) {
        changed[field] = true;
      }
    }
    if (profilePicture) changed.profilePicture = true;
    const changedFields = changedFieldLabels(changed);
    updated = await repository.updateProfile(id, {
      ...profileFields,
      profilePictureUrl,
      previousEmail: user.email,
      actorLabel: actor ? formatAdminLabel(actor) : null,
      changedFields,
    });
  } catch (error) {
    removeProfilePicture(profilePictureUrl);
    throw error;
  }
  if (profilePictureUrl && user.profile_picture_url) {
    removeProfilePicture(user.profile_picture_url);
  }
  if (actor && await repository.isSecurityGuardUser(id)) {
    securityEvents.publishProfileUpdated(id);
  }
  if (actor && await repository.isResidentUser(id, updated.email)) {
    residentDashboardEvents.publishToUser(id, 'resident-updated');
  }
  return sanitize(updated);
};

const updateStatus = async (id, status, actor = null) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const updated = await repository.updateStatus(id, status, {
    actorLabel: actor ? formatAdminLabel(actor) : null,
    changedFields: ['account status'],
    residentEmail: user.email,
  });
  if (status !== 'ACTIVE') {
    // Revoking sessions on suspend/archive keeps a de-activated account
    // from continuing to use a refresh token issued before the change.
    await authRepository.revokeAllUserRefreshTokens(id);
  }
  if (actor && await repository.isSecurityGuardUser(id)) {
    securityEvents.publishProfileUpdated(id);
  }
  if (actor && await repository.isResidentUser(id, user.email)) {
    residentDashboardEvents.publishToUser(id, 'resident-updated');
  }
  return sanitize(updated);
};

const archiveUser = async (id, actor = null) => updateStatus(id, 'ARCHIVED', actor);

const forceLogout = async (id) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  await authRepository.revokeAllUserRefreshTokens(id);
  await authRepository.closeOpenLoginHistory(id);
};

const getLoginHistory = async (id) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return authRepository.listLoginHistory(id);
};

module.exports = {
  listUsers,
  listAccessibleSocieties,
  getUserById,
  createUser,
  updateProfile,
  updateStatus,
  archiveUser,
  forceLogout,
  getLoginHistory,
};
