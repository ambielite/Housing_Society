const db = require('../../config/db');

// --- document_permissions ---------------------------------------------------

const grantPermission = async ({ documentId, roleId, userId, permissionType, expiresAt }) => {
  const result = await db.query(
    `INSERT INTO document_permissions (document_id, role_id, user_id, permission_type, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [documentId, roleId || null, userId || null, permissionType, expiresAt || null]
  );
  return result.rows[0];
};

const findPermissionById = async (id) => {
  const result = await db.query('SELECT * FROM document_permissions WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listPermissionsForDocument = async (documentId) => {
  const result = await db.query(
    'SELECT * FROM document_permissions WHERE document_id = $1 ORDER BY created_at DESC',
    [documentId]
  );
  return result.rows;
};

const revokePermission = async (id) => {
  const result = await db.query('DELETE FROM document_permissions WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- document_links -----------------------------------------------------------

const createLink = async ({ documentId, entityType, entityId, linkType }) => {
  const result = await db.query(
    `INSERT INTO document_links (document_id, entity_type, entity_id, link_type)
     VALUES ($1, $2, $3, COALESCE($4, 'ATTACHMENT'))
     RETURNING *`,
    [documentId, entityType, entityId, linkType]
  );
  return result.rows[0];
};

const findLinkById = async (id) => {
  const result = await db.query('SELECT * FROM document_links WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listLinksForDocument = async (documentId) => {
  const result = await db.query('SELECT * FROM document_links WHERE document_id = $1', [documentId]);
  return result.rows;
};

const listLinksForEntity = async (entityType, entityId) => {
  const result = await db.query(
    'SELECT * FROM document_links WHERE entity_type = $1 AND entity_id = $2',
    [entityType, entityId]
  );
  return result.rows;
};

const deleteLink = async (id) => {
  const result = await db.query('DELETE FROM document_links WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

module.exports = {
  grantPermission,
  findPermissionById,
  listPermissionsForDocument,
  revokePermission,
  createLink,
  findLinkById,
  listLinksForDocument,
  listLinksForEntity,
  deleteLink,
};
