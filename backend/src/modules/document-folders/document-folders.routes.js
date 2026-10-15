const express = require('express');
const multer = require('multer');
const controller = require('./document-folders.controller');
const validate = require('../../common/validate');
const ApiError = require('../../common/ApiError');
const {
  createFolderSchema,
  listFoldersQuerySchema,
  updateFolderSchema,
  uploadDocumentSchema,
  listDocumentsQuerySchema,
  updateDocumentSchema,
  addVersionSchema,
} = require('./document-folders.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// --- multer setup (memory storage, so the buffer is available for
// checksum computation before we ever write to disk) ---
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, `File type ${file.mimetype} is not allowed`));
    }
    cb(null, true);
  },
});

/** Wraps a single-file multer middleware so its errors flow through the normal error handler. */
const singleFile = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return next(new ApiError(400, err.message));
      }
      return next(err);
    }
    next();
  });
};

// Folders
router.post('/folders', authorize('DOCUMENT_FOLDER_CREATE'), validate(createFolderSchema), controller.createFolder);
router.get(
  '/folders',
  authorize('DOCUMENT_FOLDER_READ'),
  validate(listFoldersQuerySchema, 'query'),
  controller.listFolders
);
router.get('/folders/:folderId', authorize('DOCUMENT_FOLDER_READ'), controller.getFolder);
router.put('/folders/:folderId', authorize('DOCUMENT_FOLDER_UPDATE'), validate(updateFolderSchema), controller.updateFolder);
router.delete('/folders/:folderId', authorize('DOCUMENT_FOLDER_DELETE'), controller.deleteFolder);

// Documents
router.post(
  '/documents',
  authorize('DOCUMENT_CREATE'),
  singleFile('file'),
  validate(uploadDocumentSchema),
  controller.uploadDocument
);
router.get(
  '/documents',
  authorize('DOCUMENT_READ'),
  validate(listDocumentsQuerySchema, 'query'),
  controller.listDocuments
);
router.get('/documents/:documentId', authorize('DOCUMENT_READ'), controller.getDocument);
router.put(
  '/documents/:documentId',
  authorize('DOCUMENT_UPDATE'),
  validate(updateDocumentSchema),
  controller.updateDocument
);
router.delete('/documents/:documentId', authorize('DOCUMENT_DELETE'), controller.deleteDocument);
router.get('/documents/:documentId/download', authorize('DOCUMENT_DOWNLOAD'), controller.downloadDocument);
router.get('/documents/:documentId/download-history', authorize('DOCUMENT_READ'), controller.listDownloadHistory);

router.post(
  '/documents/:documentId/versions',
  authorize('DOCUMENT_VERSION_CREATE'),
  singleFile('file'),
  validate(addVersionSchema),
  controller.addVersion
);
router.get('/documents/:documentId/versions', authorize('DOCUMENT_VERSION_READ'), controller.listVersions);

module.exports = router;
