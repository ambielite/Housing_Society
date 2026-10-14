const db = require('../../config/db');

const getUserRoles = async (userId, societyId) => {
  const result = await db.query(
    `SELECT r.* FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
       AND (ur.society_id IS NULL OR ur.society_id = $2)`,
    [userId, societyId]
  );
  return result.rows;
};

const getUserPermissions = async (userId, societyId) => {
  const result = await db.query(
    `SELECT DISTINCT p.* FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN roles r ON r.id = rp.role_id
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
       AND (ur.society_id IS NULL OR ur.society_id = $2)`,
    [userId, societyId]
  );
  return result.rows;
};

const listPermissions = async () => {
  const result = await db.query('SELECT * FROM permissions ORDER BY module, action');
  return result.rows;
};

const listRoles = async (societyId) => {
  const result = await db.query(
    'SELECT * FROM roles WHERE society_id IS NULL OR society_id = $1 ORDER BY name',
    [societyId]
  );
  return result.rows;
};

const findRoleById = async (id) => {
  const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const findRoleByCode = async (code, societyId) => {
  const result = await db.query(
    'SELECT * FROM roles WHERE code = $1 AND (society_id IS NULL OR society_id = $2)',
    [code, societyId]
  );
  return result.rows[0] || null;
};

const createRole = async ({ societyId, name, code, description }) => {
  const result = await db.query(
    `INSERT INTO roles (society_id, name, code, description, is_system_role, status)
     VALUES ($1, $2, $3, $4, false, 'ACTIVE')
     RETURNING *`,
    [societyId || null, name, code, description || null]
  );
  return result.rows[0];
};

const updateRole = async (id, { name, description, status }) => {
  const result = await db.query(
    `UPDATE roles SET
       name        = COALESCE($2, name),
       description = COALESCE($3, description),
       status      = COALESCE($4, status),
       updated_at  = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, description, status]
  );
  return result.rows[0] || null;
};

const deleteRole = async (id) => {
  const result = await db.query(
    'DELETE FROM roles WHERE id = $1 AND is_system_role = false RETURNING id',
    [id]
  );
  return result.rows[0] || null;
};

const findPermissionByCode = async (code) => {
  const result = await db.query('SELECT * FROM permissions WHERE code = $1', [code]);
  return result.rows[0] || null;
};

const assignPermissionToRole = async (roleId, permissionId) => {
  await db.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [roleId, permissionId]
  );
};

const removePermissionFromRole = async (roleId, permissionId) => {
  await db.query('DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [roleId, permissionId]);
};

const getRolePermissions = async (roleId) => {
  const result = await db.query(
    `SELECT p.* FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1
     ORDER BY p.module, p.action`,
    [roleId]
  );
  return result.rows;
};

/**
 * The DB spec's user_roles primary key is (user_id, role_id) only -
 * society_id is a plain FK column. So "assigning" a role the user already
 * holds simply moves/refreshes that one row's society_id instead of
 * creating a second row.
 */
const assignRoleToUser = async ({ userId, roleId, societyId, assignedBy }) => {
  const result = await db.query(
    `INSERT INTO user_roles (user_id, role_id, society_id, assigned_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, role_id)
     DO UPDATE SET society_id = EXCLUDED.society_id, assigned_at = now(), assigned_by = EXCLUDED.assigned_by
     RETURNING *`,
    [userId, roleId, societyId || null, assignedBy || null]
  );
  return result.rows[0];
};

const removeRoleFromUser = async ({ userId, roleId }) => {
  await db.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, roleId]);
};

module.exports = {
  getUserRoles,
  getUserPermissions,
  listPermissions,
  listRoles,
  findRoleById,
  findRoleByCode,
  createRole,
  updateRole,
  deleteRole,
  findPermissionByCode,
  assignPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  assignRoleToUser,
  removeRoleFromUser,
};
