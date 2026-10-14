const ApiError = require('../../common/ApiError');
const repository = require('./rbac.repository');

const listPermissions = () => repository.listPermissions();

const listRoles = (societyId) => repository.listRoles(societyId);

const createRole = async ({ societyId, name, code, description }) => {
  const normalizedCode = code.toUpperCase();
  const existing = await repository.findRoleByCode(normalizedCode, societyId);
  if (existing) {
    throw new ApiError(409, 'A role with this code already exists in this scope');
  }
  return repository.createRole({ societyId, name, code: normalizedCode, description });
};

const updateRole = async (id, payload) => {
  const role = await repository.findRoleById(id);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }
  if (role.is_system_role) {
    throw new ApiError(400, 'System roles cannot be modified');
  }
  return repository.updateRole(id, payload);
};

const deleteRole = async (id) => {
  const role = await repository.findRoleById(id);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }
  if (role.is_system_role) {
    throw new ApiError(400, 'System roles cannot be deleted');
  }
  const deleted = await repository.deleteRole(id);
  if (!deleted) {
    throw new ApiError(400, 'Role could not be deleted');
  }
  return deleted;
};

const getRolePermissions = async (roleId) => {
  const role = await repository.findRoleById(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }
  return repository.getRolePermissions(roleId);
};

const assignPermissionToRole = async (roleId, permissionCode) => {
  const role = await repository.findRoleById(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }
  const permission = await repository.findPermissionByCode(permissionCode.toUpperCase());
  if (!permission) {
    throw new ApiError(404, 'Permission not found');
  }
  await repository.assignPermissionToRole(roleId, permission.id);
  return repository.getRolePermissions(roleId);
};

const removePermissionFromRole = async (roleId, permissionCode) => {
  const role = await repository.findRoleById(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }
  const permission = await repository.findPermissionByCode(permissionCode.toUpperCase());
  if (!permission) {
    throw new ApiError(404, 'Permission not found');
  }
  await repository.removePermissionFromRole(roleId, permission.id);
  return repository.getRolePermissions(roleId);
};

const assignRoleToUser = async ({ userId, roleCode, societyId, assignedBy }) => {
  const role = await repository.findRoleByCode(roleCode.toUpperCase(), societyId);
  if (!role) {
    throw new ApiError(404, 'Role not found in this society scope');
  }
  await repository.assignRoleToUser({ userId, roleId: role.id, societyId, assignedBy });
  return repository.getUserRoles(userId, societyId);
};

const removeRoleFromUser = async ({ userId, roleCode, societyId }) => {
  const role = await repository.findRoleByCode(roleCode.toUpperCase(), societyId);
  if (!role) {
    throw new ApiError(404, 'Role not found in this society scope');
  }
  await repository.removeRoleFromUser({ userId, roleId: role.id });
  return repository.getUserRoles(userId, societyId);
};

const getUserRolesAndPermissions = async (userId, societyId) => {
  const [roles, permissions] = await Promise.all([
    repository.getUserRoles(userId, societyId),
    repository.getUserPermissions(userId, societyId),
  ]);
  return { roles, permissions };
};

module.exports = {
  listPermissions,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRolesAndPermissions,
};
