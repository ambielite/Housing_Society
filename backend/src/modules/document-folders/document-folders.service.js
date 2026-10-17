const ApiError = require('../../common/ApiError');
const repository = require('./document-folders.repository');
const storage = require('./storage.helper');
const { isVendorScoped, getVendorIds } = require('../../common/vendorScope');

const ELEVATED_ROLES = ['SUPER_ADMIN', 'SOCIETY_ADMIN'];
const COMMITTEE_ROLES = [...ELEVATED_ROLES, 'PRESIDENT_SECRETARY', 'TREASURER'];

// --- folders --------------------------------------------------------------------

const createFolder = async (payload) => {
  if (payload.parentFolderId) {
    const parent = await repository.findFolderById(payload.parentFolderId);
    if (!parent) {
      throw new ApiError(404, 'Parent folder not found');
    }
  }
  return repository.createFolder(payload);
};

const listFolders = (query) => repository.listFolders(query);

const getFolder = async (id) => {
  const folder = await repository.findFolderById(id);
  if (!folder) {
    throw new ApiError(404, 'Folder not found');
  }
  return folder;
};

const updateFolder = async (id, payload) => {
  const folder = await repository.findFolderById(id);
  if (!folder) {
    throw new ApiError(404, 'Folder not found');
  }
  return repository.updateFolder(id, payload);
};

const deleteFolder = async (id) => {
  const folder = await repository.findFolderById(id);
  if (!folder) {
    throw new ApiError(404, 'Folder not found');
  }
  const deleted = await repository.deleteFolder(id);
  if (!deleted) {
    throw new ApiError(400, 'Folder could not be deleted (it may still contain documents/sub-folders)');
  }
  return deleted;
};

// --- access control -----------------------------------------------------------

/**
 * Module-level RBAC grants access to the document area. Visibility then
 * limits each document to the society, committee, or explicit recipients.
 * CONFIDENTIAL sensitivity adds a separate restriction on top of visibility.
 */
const assertCanAccess = async (document, actingUser, action = 'READ') => {
  const roles = actingUser.roles || [];
  const permissions = actingUser.permissions || [];
  const isElevated = roles.some((role) => ELEVATED_ROLES.includes(role));
  const isCommittee = roles.some((role) => COMMITTEE_ROLES.includes(role));
  const isUploader = document.uploaded_by === actingUser.id;

  const visibility = document.visibility || 'INTERNAL';
  // All document visibility remains scoped to the authenticated society.
  if (document.society_id !== actingUser.societyId) {
    throw new ApiError(404, 'Document not found');
  }

  // PUBLIC is the only visibility available to authenticated users without
  // a document role permission. It is still limited to their active society.
  const publicSocietyAccess = visibility === 'PUBLIC';
  const requiresGrant = visibility === 'PRIVATE' || visibility === 'COMMITTEE_ONLY';
  const grant = !isUploader && !isElevated && requiresGrant
    ? await repository.findActivePermissionGrant(document.id, actingUser.id, roles)
    : null;

  if (!publicSocietyAccess && !isElevated && !isUploader && !grant &&
      !(visibility === 'COMMITTEE_ONLY' && isCommittee) && !permissions.includes('DOCUMENT_READ')) {
    throw new ApiError(403, 'You do not have permission to read this document');
  }
  if (action === 'DOWNLOAD' && !publicSocietyAccess && !isElevated && !permissions.includes('DOCUMENT_DOWNLOAD')) {
    throw new ApiError(403, 'You do not have permission to download this document');
  }

  if (visibility === 'PRIVATE' && !isUploader && !isElevated && !grant) {
    throw new ApiError(403, 'This document is private and has not been shared with you');
  }
  if (visibility === 'COMMITTEE_ONLY' && !isCommittee && !isUploader && !isElevated && !grant) {
    throw new ApiError(403, 'This document is available to committee members only');
  }
  if (!['PUBLIC', 'SOCIETY', 'INTERNAL', 'COMMITTEE_ONLY', 'PRIVATE'].includes(visibility)) {
    throw new ApiError(403, 'This document has an unsupported visibility setting');
  }

  // Society-visible documents are governed by the society-scoped document
  // permission above, including for users who also have the VENDOR role.
  // Keep the narrower vendor-record scope for internal/private documents.
  if (isVendorScoped(actingUser) && !['PUBLIC', 'SOCIETY'].includes(visibility)) {
    const vendorIds = getVendorIds(actingUser);
    const allowed = await repository.isDocumentLinkedToVendorScope(document.id, vendorIds, actingUser.id);
    if (!allowed) throw new ApiError(404, 'Document not found');
  }

  if (document.sensitivity !== 'CONFIDENTIAL') return;
  if (isUploader || isElevated || grant) return;

  const confidentialGrant = grant || await repository.findActivePermissionGrant(document.id, actingUser.id, roles);
  if (!confidentialGrant) throw new ApiError(403, 'You do not have permission to access this confidential document');
};

// --- documents ------------------------------------------------------------------

const uploadDocument = async ({
  file, societyId, folderId, documentType, title, sensitivity,
  uploadedBy, effectiveDate, expiryDate, visibility,
}) => {
  if (!file) {
    throw new ApiError(422, 'A file is required');
  }
  const folder = await repository.findFolderById(folderId);
  if (!folder) {
    throw new ApiError(404, 'Folder not found');
  }

  const checksum = storage.computeChecksum(file.buffer);
  const storageKey = storage.saveFile(file.buffer, file.originalname);

  const document = await repository.createDocument({
    societyId,
    folderId,
    documentType,
    title,
    fileName: file.originalname,
    storageKey,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    checksum,
    sensitivity,
    uploadedBy,
    effectiveDate,
    expiryDate,
    visibility,
  });

  // The initial upload is version 1 of its own version history.
  await repository.addVersion({
    documentId: document.id,
    versionNo: 1,
    storageKey,
    checksum,
    uploadedBy,
    changeNote: 'Initial upload',
  });

  return document;
};

const listDocuments = async (query, actingUser) => {
  const documents = await repository.listDocuments(query);
  const visible = [];
  for (const doc of documents) {
    try {
      await assertCanAccess(doc, actingUser, 'READ');
      visible.push(doc);
    } catch (err) {
      // silently omit documents the caller can't see, rather than erroring the whole list
    }
  }
  return visible;
};

const getDocument = async (id, actingUser) => {
  const document = await repository.findDocumentById(id);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  await assertCanAccess(document, actingUser, 'READ');
  return document;
};

const updateDocument = async (id, payload, actingUser) => {
  const document = await repository.findDocumentById(id);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  await assertCanAccess(document, actingUser);
  return repository.updateDocument(id, payload);
};

const deleteDocument = async (id, actingUser) => {
  const document = await repository.findDocumentById(id);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  await assertCanAccess(document, actingUser);
  const versions = await repository.listVersions(id);
  const deleted = await repository.deleteDocument(id);
  if (!deleted) {
    throw new ApiError(400, 'Document could not be deleted');
  }
  // Clean up every version's file from disk.
  for (const version of versions) {
    storage.deleteFile(version.storage_key);
  }
  return deleted;
};

/** Returns the absolute file path + document row, after an access check, and logs the download. */
const downloadDocument = async (id, actingUser, meta = {}) => {
  const document = await repository.findDocumentById(id);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  await assertCanAccess(document, actingUser, 'DOWNLOAD');

  await repository.logDownload({ documentId: id, downloadedBy: actingUser.id, ipAddress: meta.ipAddress });

  return { document, fullPath: storage.getFullPath(document.storage_key) };
};

const listDownloadHistory = async (id, actingUser) => {
  const document = await repository.findDocumentById(id);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  await assertCanAccess(document, actingUser);
  return repository.listDownloadHistory(id);
};

// --- versions -------------------------------------------------------------------------

const addVersion = async (documentId, { file, uploadedBy, changeNote }, actingUser) => {
  if (!file) {
    throw new ApiError(422, 'A file is required');
  }
  const document = await repository.findDocumentById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  await assertCanAccess(document, actingUser);

  const checksum = storage.computeChecksum(file.buffer);
  const storageKey = storage.saveFile(file.buffer, file.originalname);
  const currentCount = await repository.countVersions(documentId);
  const versionNo = currentCount + 1;

  const version = await repository.addVersion({ documentId, versionNo, storageKey, checksum, uploadedBy, changeNote });

  // The document's own row always reflects the latest version, so a
  // plain GET/download without specifying a version returns the newest one.
  await repository.updateDocumentFile(documentId, { storageKey, checksum, fileName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size });

  return version;
};

const listVersions = async (documentId, actingUser) => {
  const document = await repository.findDocumentById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  await assertCanAccess(document, actingUser);
  return repository.listVersions(documentId);
};

module.exports = {
  createFolder,
  listFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  listDownloadHistory,
  addVersion,
  listVersions,
  assertCanAccess,
};
