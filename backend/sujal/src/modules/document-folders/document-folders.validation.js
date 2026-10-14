const Joi = require('joi');

const FOLDER_TYPES = ['BYLAWS', 'RERA', 'AUDIT_REPORTS', 'AGM_MINUTES', 'CONTRACTS', 'POLICIES', 'OTHER'];
const FOLDER_STATUSES = ['ACTIVE', 'INACTIVE'];
const DOCUMENT_TYPES = ['BYLAW', 'RERA_CERT', 'AUDIT_REPORT', 'AGM_MINUTES', 'CONTRACT', 'POLICY', 'OTHER'];
const SENSITIVITIES = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'];
const VISIBILITIES = ['PUBLIC', 'COMMITTEE_ONLY', 'PRIVATE'];
const DOCUMENT_STATUSES = ['ACTIVE', 'ARCHIVED', 'DELETED'];

const createFolderSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  parentFolderId: Joi.string().uuid().allow(null),
  name: Joi.string().max(150).required(),
  folderType: Joi.string().valid(...FOLDER_TYPES).required(),
});

const listFoldersQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  parentFolderId: Joi.string().uuid().allow('null'),
  status: Joi.string().valid(...FOLDER_STATUSES),
});

const updateFolderSchema = Joi.object({
  name: Joi.string().max(150),
  folderType: Joi.string().valid(...FOLDER_TYPES),
  status: Joi.string().valid(...FOLDER_STATUSES),
}).min(1);

// multipart/form-data - Joi validates the text fields; the file itself
// arrives separately via multer as req.file.
const uploadDocumentSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  folderId: Joi.string().uuid().required(),
  documentType: Joi.string().valid(...DOCUMENT_TYPES).required(),
  title: Joi.string().max(255).required(),
  sensitivity: Joi.string().valid(...SENSITIVITIES),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  visibility: Joi.string().valid(...VISIBILITIES),
});

const listDocumentsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  folderId: Joi.string().uuid(),
  documentType: Joi.string().valid(...DOCUMENT_TYPES),
  sensitivity: Joi.string().valid(...SENSITIVITIES),
  status: Joi.string().valid(...DOCUMENT_STATUSES),
  search: Joi.string().max(150),
});

const updateDocumentSchema = Joi.object({
  title: Joi.string().max(255),
  documentType: Joi.string().valid(...DOCUMENT_TYPES),
  sensitivity: Joi.string().valid(...SENSITIVITIES),
  effectiveDate: Joi.date().iso().allow('', null),
  expiryDate: Joi.date().iso().allow('', null),
  visibility: Joi.string().valid(...VISIBILITIES),
  status: Joi.string().valid(...DOCUMENT_STATUSES),
}).min(1);

const addVersionSchema = Joi.object({
  changeNote: Joi.string().max(500).allow('', null),
});

module.exports = {
  createFolderSchema,
  listFoldersQuerySchema,
  updateFolderSchema,
  uploadDocumentSchema,
  listDocumentsQuerySchema,
  updateDocumentSchema,
  addVersionSchema,
};
