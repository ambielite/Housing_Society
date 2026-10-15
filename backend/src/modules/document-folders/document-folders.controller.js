const fs = require('fs');
const service = require('./document-folders.service');
const ApiResponse = require('../../common/ApiResponse');
const ApiError = require('../../common/ApiError');
const asyncHandler = require('../../common/asyncHandler');

// --- folders ---
const createFolder = asyncHandler(async (req, res) => {
  const folder = await service.createFolder(req.body);
  return ApiResponse.success(res, folder, 'Folder created successfully', 201);
});

const listFolders = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  if (query.parentFolderId === 'null') query.parentFolderId = null;
  const folders = await service.listFolders(query);
  return ApiResponse.success(res, folders);
});

const getFolder = asyncHandler(async (req, res) => {
  const folder = await service.getFolder(req.params.folderId);
  return ApiResponse.success(res, folder);
});

const updateFolder = asyncHandler(async (req, res) => {
  const folder = await service.updateFolder(req.params.folderId, req.body);
  return ApiResponse.success(res, folder, 'Folder updated successfully');
});

const deleteFolder = asyncHandler(async (req, res) => {
  await service.deleteFolder(req.params.folderId);
  return ApiResponse.success(res, null, 'Folder deleted successfully');
});

// --- documents ---
const uploadDocument = asyncHandler(async (req, res) => {
  const document = await service.uploadDocument({
    file: req.file,
    uploadedBy: req.user.id,
    ...req.body,
  });
  return ApiResponse.success(res, document, 'Document uploaded successfully', 201);
});

const listDocuments = asyncHandler(async (req, res) => {
  const documents = await service.listDocuments(req.query, req.user);
  return ApiResponse.success(res, documents);
});

const getDocument = asyncHandler(async (req, res) => {
  const document = await service.getDocument(req.params.documentId, req.user);
  return ApiResponse.success(res, document);
});

const updateDocument = asyncHandler(async (req, res) => {
  const document = await service.updateDocument(req.params.documentId, req.body, req.user);
  return ApiResponse.success(res, document, 'Document updated successfully');
});

const deleteDocument = asyncHandler(async (req, res) => {
  await service.deleteDocument(req.params.documentId, req.user);
  return ApiResponse.success(res, null, 'Document deleted successfully');
});

const downloadDocument = asyncHandler(async (req, res) => {
  const { document, fullPath } = await service.downloadDocument(req.params.documentId, req.user, { ipAddress: req.ip });
  if (!fs.existsSync(fullPath)) {
    throw new ApiError(404, 'The stored file is missing from disk');
  }
  res.download(fullPath, document.file_name);
});

const listDownloadHistory = asyncHandler(async (req, res) => {
  const history = await service.listDownloadHistory(req.params.documentId, req.user);
  return ApiResponse.success(res, history);
});

// --- versions ---
const addVersion = asyncHandler(async (req, res) => {
  const version = await service.addVersion(req.params.documentId, {
    file: req.file,
    uploadedBy: req.user.id,
    changeNote: req.body.changeNote,
  }, req.user);
  return ApiResponse.success(res, version, 'New document version uploaded successfully', 201);
});

const listVersions = asyncHandler(async (req, res) => {
  const versions = await service.listVersions(req.params.documentId, req.user);
  return ApiResponse.success(res, versions);
});

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
};
