const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./ApiError');
const asyncHandler = require('./asyncHandler');
const usersRepository = require('../modules/users/users.repository');
const rbacRepository = require('../modules/rbac/rbac.repository');
const vendorsRepository = require('../modules/vendors/vendors.repository');

/**
 * Verifies the JWT access token, loads the user from PostgreSQL (never
 * trusts a client-supplied identity), resolves the active society context,
 * and attaches req.user = { id, email, societyId, roles[], permissions[] }.
 *
 * Society context resolution: an optional `x-society-id` header lets a
 * multi-society admin pick which society they are acting in for this
 * request; it falls back to the user's own society_id. This header is
 * never trusted for *authorization* by itself - it only narrows which
 * roles/permissions (already tied to the authenticated user) apply.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token missing');
  }
  const token = header.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await usersRepository.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User account no longer exists');
  }
  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'User account is not active');
  }

  const societyId = req.headers['x-society-id'] || user.society_id || null;

  const [roles, permissions] = await Promise.all([
    rbacRepository.getUserRoles(user.id, societyId),
    rbacRepository.getUserPermissions(user.id, societyId),
  ]);

  const roleCodes = roles.map((r) => r.code);

  // If this user is (or includes) the VENDOR role, resolve which vendor
  // record they own so service-layer code can scope queries to
  // "only my own vendor data" instead of the whole society's.
  let vendorIds = [];
  if (roleCodes.includes('VENDOR')) {
    // Mapping table supports several users for one vendor; legacy user_id
    // remains included for backwards compatibility during migration.
    vendorIds = await vendorsRepository.listVendorIdsByUserId(user.id);
    if (!vendorIds.length) {
      const ownVendor = await vendorsRepository.findByUserId(user.id);
      vendorIds = ownVendor ? [ownVendor.id] : [];
    }
  }
  const vendorId = vendorIds[0] || null;

  req.user = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    status: user.status,
    societyId,
    vendorId,
    vendorIds,
    roles: roleCodes,
    permissions: permissions.map((p) => p.code),
  };

  next();
});

/**
 * @param {...string} requiredPermissions permission codes, all required
 */
const authorize = (...requiredPermissions) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (req.user.roles.includes('SUPER_ADMIN')) {
    return next();
  }
  const hasAll = requiredPermissions.every((perm) => req.user.permissions.includes(perm));
  if (!hasAll) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorize };