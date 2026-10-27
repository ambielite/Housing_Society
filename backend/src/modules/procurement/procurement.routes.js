const express = require('express');
const multer = require('multer');
const controller = require('./procurement.controller');
const validate = require('../../common/validate');
const {
  createRequestSchema,
  listRequestsQuerySchema,
  updateRequestStatusSchema,
  addRequestLineSchema,
  createRfqSchema,
  inviteVendorSchema,
  submitQuotationSchema,
  addQuotationLineSchema,
  decideQuotationSchema,
  addComparisonSchema,
} = require('./procurement.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');
const ApiError = require('../../common/ApiError');

const router = express.Router();

const uploadQuotationDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return callback(new ApiError(400, 'Upload a PDF, JPEG, PNG, or WebP quotation document'));
    }
    callback(null, true);
  },
});
const parseQuotationDocument = (req, res, next) => {
  uploadQuotationDocument.single('document')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') return next(new ApiError(413, 'Quotation documents must be 10 MB or smaller'));
    return next(error instanceof ApiError ? error : new ApiError(400, error.message || 'Could not upload quotation document'));
  });
};

router.use(authenticate);

// Purchase requests
router.get('/requests', authorize('PURCHASE_REQUEST_READ'), validate(listRequestsQuerySchema, 'query'), controller.listRequests);
router.post('/requests', authorize('PURCHASE_REQUEST_CREATE'), validate(createRequestSchema), controller.createRequest);
router.get('/requests/:requestId', authorize('PURCHASE_REQUEST_READ'), controller.getRequest);
router.patch(
  '/requests/:requestId/status',
  authorize('PURCHASE_REQUEST_UPDATE'),
  validate(updateRequestStatusSchema),
  controller.updateRequestStatus
);
router.delete('/requests/:requestId', authorize('PURCHASE_REQUEST_DELETE'), controller.deleteRequest);

router.post(
  '/requests/:requestId/lines',
  authorize('PURCHASE_REQUEST_UPDATE'),
  validate(addRequestLineSchema),
  controller.addRequestLine
);
router.get('/requests/:requestId/lines', authorize('PURCHASE_REQUEST_READ'), controller.listRequestLines);

// RFQs
router.post('/rfqs', authorize('RFQ_CREATE'), validate(createRfqSchema), controller.createRfq);
router.get('/requests/:requestId/rfqs', authorize('RFQ_READ'), controller.listRfqs);
router.get('/rfqs/:rfqId', authorize('RFQ_READ'), controller.getRfq);
router.patch('/rfqs/:rfqId/close', authorize('RFQ_UPDATE'), controller.closeRfq);

router.post('/rfqs/:rfqId/vendors', authorize('RFQ_UPDATE'), validate(inviteVendorSchema), controller.inviteVendor);
router.get('/rfqs/:rfqId/vendors', authorize('RFQ_READ'), controller.listInvitedVendors);

// Quotations
router.post('/quotations', authorize('QUOTATION_CREATE'), parseQuotationDocument, validate(submitQuotationSchema), controller.submitQuotation);
router.get('/rfqs/:rfqId/quotations', authorize('QUOTATION_READ'), controller.listQuotations);
router.post('/quotations/:quotationId/document', authorize('QUOTATION_CREATE'), parseQuotationDocument, controller.uploadQuotationDocument);
router.get('/quotations/:quotationId/document', authorize('QUOTATION_READ'), controller.downloadQuotationDocument);
router.get('/quotations/:quotationId', authorize('QUOTATION_READ'), controller.getQuotation);
router.post(
  '/quotations/:quotationId/lines',
  authorize('QUOTATION_CREATE'),
  validate(addQuotationLineSchema),
  controller.addQuotationLine
);
router.patch(
  '/quotations/:quotationId/decide',
  authorize('QUOTATION_UPDATE'),
  validate(decideQuotationSchema),
  controller.decideQuotation
);

// Comparisons
router.post(
  '/rfqs/:rfqId/comparisons',
  authorize('QUOTATION_COMPARISON_MANAGE'),
  validate(addComparisonSchema),
  controller.addComparison
);
router.get('/rfqs/:rfqId/comparisons', authorize('QUOTATION_COMPARISON_MANAGE'), controller.listComparisons);

module.exports = router;
