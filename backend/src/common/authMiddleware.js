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
 * An optional `x-society-id` selects the active society, but is accepted only
 * when the authenticated user has a current direct or hierarchical grant.
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

  const headerSocietyId = req.headers['x-society-id'] || null;
  const explicitSocietyIds = [req.params?.societyId, req.query?.societyId, req.body?.societyId].filter(Boolean);
  let societyId = headerSocietyId || explicitSocietyIds[0] || user.society_id || null;
  if (!societyId) {
    const isSuperAdmin = (await rbacRepository.getUserRoles(user.id, null)).some((role) => role.code === 'SUPER_ADMIN');
    const accessible = await usersRepository.listAccessibleSocieties(user.id, isSuperAdmin);
    societyId = accessible[0]?.id || null;
  }
  if (explicitSocietyIds.some((id) => id !== societyId)) {
    throw new ApiError(403, 'Request society must match the selected society');
  }
  if (societyId && (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(societyId) ||
    !await usersRepository.hasSocietyAccess(user.id, societyId)
  )) {
    throw new ApiError(403, 'You do not have access to the selected society');
  }

  // Expose a consistent active-society filter to both API generations. Older
  // controllers read req.query/body directly instead of req.user.societyId.
  if (societyId) {
    Object.defineProperty(req, 'query', {
      configurable: true,
      writable: true,
      value: { ...req.query, societyId: req.query?.societyId || societyId },
    });
    const isCreatingSociety = req.method === 'POST' && req.originalUrl?.split('?')[0].replace(/\/$/, '') === '/api/societies';
    if (!isCreatingSociety && req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      req.body.societyId ||= societyId;
    }
  }

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
