const bcrypt = require('bcryptjs');
const ApiError = require('../../common/ApiError');
const { getPagination } = require('../../common/pagination');
const repository = require('./users.repository');
const rbacRepository = require('../rbac/rbac.repository');
const authRepository = require('../auth/auth.repository');

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

const getUserById = async (id) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const roles = await rbacRepository.getUserRoles(id, user.society_id);
  return { ...sanitize(user), roles: roles.map((r) => r.code) };
};

const createUser = async ({ email, password, firstName, lastName, phone, societyId, status }) => {
  const existing = await repository.findByEmail(email.toLowerCase());
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await repository.createUser({
    societyId,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    firstName,
    lastName,
    status,
  });
  return sanitize(user);
};

const updateProfile = async (id, payload) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const updated = await repository.updateProfile(id, payload);
  return sanitize(updated);
};

const updateStatus = async (id, status) => {
  const user = await repository.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const updated = await repository.updateStatus(id, status);
  if (status !== 'ACTIVE') {
    // Revoking sessions on suspend/archive keeps a de-activated account
    // from continuing to use a refresh token issued before the change.
    await authRepository.revokeAllUserRefreshTokens(id);
  }
  return sanitize(updated);
};

const archiveUser = async (id) => updateStatus(id, 'ARCHIVED');

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
  getUserById,
  createUser,
  updateProfile,
  updateStatus,
  archiveUser,
  forceLogout,
  getLoginHistory,
};
