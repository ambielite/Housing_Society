const db = require('../../config/db');

// --- document_folders ----------------------------------------------------------

const createFolder = async ({ societyId, parentFolderId, name, folderType }) => {
  const result = await db.query(
    `INSERT INTO document_folders (society_id, parent_folder_id, name, folder_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [societyId, parentFolderId || null, name, folderType]
  );
  return result.rows[0];
};

const findFolderById = async (id) => {
  const result = await db.query('SELECT * FROM document_folders WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listFolders = async ({ societyId, parentFolderId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (parentFolderId !== undefined) {
    if (parentFolderId === null) {
      conditions.push('parent_folder_id IS NULL');
    } else {
      conditions.push(`parent_folder_id = $${idx++}`);
      params.push(parentFolderId);
    }
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM document_folders ${whereClause} ORDER BY name ASC`,
    params
  );
  return result.rows;
};

const updateFolder = async (id, { name, folderType, status }) => {
  const result = await db.query(
    `UPDATE document_folders SET
       name         = COALESCE($2, name),
       folder_type  = COALESCE($3, folder_type),
       status       = COALESCE($4, status),
       updated_at   = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, folderType, status]
  );
  return result.rows[0] || null;
};

const deleteFolder = async (id) => {
  const result = await db.query('DELETE FROM document_folders WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- documents ------------------------------------------------------------------

const createDocument = async ({
  societyId, folderId, documentType, title, fileName, storageKey, mimeType,
  sizeBytes, checksum, sensitivity, uploadedBy, effectiveDate, expiryDate, visibility,
}) => {
  const result = await db.query(
    `INSERT INTO documents
       (society_id, folder_id, document_type, title, file_name, storage_key, mime_type,
        size_bytes, checksum, sensitivity, uploaded_by, effective_date, expiry_date, visibility)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'INTERNAL'), $11, $12, $13, COALESCE($14, 'INTERNAL'))
     RETURNING *`,
    [
      societyId, folderId, documentType, title, fileName, storageKey, mimeType,
      sizeBytes, checksum, sensitivity, uploadedBy, effectiveDate || null, expiryDate || null, visibility,
    ]
  );
  return result.rows[0];
};

const findDocumentById = async (id) => {
  const result = await db.query('SELECT * FROM documents WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listDocuments = async ({ societyId, folderId, documentType, sensitivity, status, search }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (folderId) {
    conditions.push(`folder_id = $${idx++}`);
    params.push(folderId);
  }
  if (documentType) {
    conditions.push(`document_type = $${idx++}`);
    params.push(documentType);
  }
  if (sensitivity) {
    conditions.push(`sensitivity = $${idx++}`);
    params.push(sensitivity);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`title ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM documents ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateDocument = async (id, { title, documentType, sensitivity, effectiveDate, expiryDate, visibility, status }) => {
  const result = await db.query(
    `UPDATE documents SET
       title           = COALESCE($2, title),
       document_type   = COALESCE($3, document_type),
       sensitivity     = COALESCE($4, sensitivity),
       effective_date  = COALESCE($5, effective_date),
       expiry_date     = COALESCE($6, expiry_date),
       visibility      = COALESCE($7, visibility),
       status          = COALESCE($8, status),
       updated_at      = now()
     WHERE id = $1
     RETURNING *`,
    [id, title, documentType, sensitivity, effectiveDate, expiryDate, visibility, status]
  );
  return result.rows[0] || null;
};

const updateDocumentFile = async (id, { storageKey, checksum, fileName, mimeType, sizeBytes }) => {
  const result = await db.query(
    `UPDATE documents SET
       storage_key  = $2,
       checksum     = $3,
       file_name    = $4,
       mime_type    = $5,
       size_bytes   = $6,
       updated_at   = now()
     WHERE id = $1
     RETURNING *`,
    [id, storageKey, checksum, fileName, mimeType, sizeBytes]
  );
  return result.rows[0] || null;
};

const deleteDocument = async (id) => {
  const result = await db.query('DELETE FROM documents WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// True only when the document is attached to data assigned to one of the caller's vendors.
const isDocumentLinkedToVendorScope = async (documentId, vendorIds, userId) => {
  if (!Array.isArray(vendorIds) || vendorIds.length === 0) return false;
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1
       FROM documents d
       WHERE d.id = $1
         AND EXISTS (
           SELECT 1 FROM vendors scope_v
           WHERE scope_v.id = ANY($2::uuid[]) AND scope_v.society_id = d.society_id
         )
         AND (
           EXISTS (
             SELECT 1 FROM vendor_documents vd
             WHERE vd.document_id = d.id AND vd.vendor_id = ANY($2::uuid[])
           ) OR
           EXISTS (
             SELECT 1 FROM vendor_contracts vc
             WHERE vc.document_id = d.id AND vc.vendor_id = ANY($2::uuid[])
           ) OR
           EXISTS (
             SELECT 1 FROM vendor_invoices vi
             WHERE vi.document_id = d.id AND vi.vendor_id = ANY($2::uuid[])
           ) OR
           EXISTS (
             SELECT 1 FROM ticket_attachments ta
             JOIN ticket_assignments tsa ON tsa.ticket_id = ta.ticket_id
             JOIN tickets t ON t.id = ta.ticket_id
             JOIN vendors v ON v.id = tsa.assigned_vendor_id
             WHERE ta.document_id = d.id AND tsa.assigned_vendor_id = ANY($2::uuid[])
               AND tsa.unassigned_at IS NULL AND t.society_id = v.society_id
           ) OR
           EXISTS (
             SELECT 1 FROM document_permissions dp
             WHERE dp.document_id = d.id AND dp.user_id = $3
               AND (dp.expires_at IS NULL OR dp.expires_at > now())
           ) OR
           EXISTS (
             SELECT 1 FROM document_links dl
             WHERE dl.document_id = d.id AND (
               (dl.entity_type = 'VENDOR_CONTRACT' AND EXISTS (
                 SELECT 1 FROM vendor_contracts vc WHERE vc.id = dl.entity_id AND vc.vendor_id = ANY($2::uuid[])
               )) OR
               (dl.entity_type = 'TICKET' AND EXISTS (
                 SELECT 1 FROM ticket_assignments tsa
                 JOIN tickets t ON t.id = tsa.ticket_id
                 JOIN vendors v ON v.id = tsa.assigned_vendor_id
                 WHERE tsa.ticket_id = dl.entity_id AND tsa.assigned_vendor_id = ANY($2::uuid[])
                   AND tsa.unassigned_at IS NULL AND t.society_id = v.society_id
               )) OR
               (dl.entity_type = 'PURCHASE_ORDER' AND EXISTS (
                 SELECT 1 FROM purchase_orders po WHERE po.id = dl.entity_id AND po.vendor_id = ANY($2::uuid[])
               ))
             )
           )
         )
     ) AS allowed`,
    [documentId, vendorIds, userId || null]
  );
  return Boolean(result.rows[0]?.allowed);
};

// --- document_versions ------------------------------------------------------------

const addVersion = async ({ documentId, versionNo, storageKey, checksum, uploadedBy, changeNote }) => {
  const result = await db.query(
    `INSERT INTO document_versions (document_id, version_no, storage_key, checksum, uploaded_by, change_note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [documentId, versionNo, storageKey, checksum, uploadedBy, changeNote || null]
  );
  return result.rows[0];
};

const listVersions = async (documentId) => {
  const result = await db.query(
    'SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version_no DESC',
    [documentId]
  );
  return result.rows;
};

const countVersions = async (documentId) => {
  const result = await db.query('SELECT COUNT(*)::int AS total FROM document_versions WHERE document_id = $1', [documentId]);
  return result.rows[0].total;
};

// --- document_downloads (audit) ----------------------------------------------------

const logDownload = async ({ documentId, downloadedBy, ipAddress }) => {
  const result = await db.query(
    `INSERT INTO document_downloads (document_id, downloaded_by, ip_address)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [documentId, downloadedBy, ipAddress || null]
  );
  return result.rows[0];
};

const listDownloadHistory = async (documentId) => {
  const result = await db.query(
    'SELECT * FROM document_downloads WHERE document_id = $1 ORDER BY downloaded_at DESC',
    [documentId]
  );
  return result.rows;
};

// --- access control helper (reads document_permissions, owned by the
// document-access module, but needed here to gate sensitive documents) --

const findActivePermissionGrant = async (documentId, userId, roleCodes) => {
  const result = await db.query(
    `SELECT dp.* FROM document_permissions dp
     LEFT JOIN roles r ON r.id = dp.role_id
     WHERE dp.document_id = $1
       AND (dp.user_id = $2 OR r.code = ANY($3::text[]))
       AND (dp.expires_at IS NULL OR dp.expires_at > now())
     LIMIT 1`,
    [documentId, userId, roleCodes || []]
  );
  return result.rows[0] || null;
};

module.exports = {
  createFolder,
  findFolderById,
  listFolders,
  updateFolder,
  deleteFolder,
  createDocument,
  findDocumentById,
  listDocuments,
  isDocumentLinkedToVendorScope,
  updateDocument,
  updateDocumentFile,
  deleteDocument,
  addVersion,
  listVersions,
  countVersions,
  logDownload,
  listDownloadHistory,
  findActivePermissionGrant,
};
