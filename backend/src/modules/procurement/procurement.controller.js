const service = require('./procurement.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- purchase requests ---
const createRequest = asyncHandler(async (req, res) => {
  const request = await service.createRequest(req.body);
  return ApiResponse.success(res, request, 'Purchase request created successfully', 201);
});

const listRequests = asyncHandler(async (req, res) => {
  const requests = await service.listRequests(req.query);
  return ApiResponse.success(res, requests);
});

const getRequest = asyncHandler(async (req, res) => {
  const request = await service.getRequest(req.params.requestId);
  return ApiResponse.success(res, request);
});

const updateRequestStatus = asyncHandler(async (req, res) => {
  const request = await service.updateRequestStatus(req.params.requestId, req.body.status);
  return ApiResponse.success(res, request, 'Purchase request status updated successfully');
});

const deleteRequest = asyncHandler(async (req, res) => {
  await service.deleteRequest(req.params.requestId);
  return ApiResponse.success(res, null, 'Purchase request deleted successfully');
});

const addRequestLine = asyncHandler(async (req, res) => {
  const line = await service.addRequestLine(req.params.requestId, req.body);
  return ApiResponse.success(res, line, 'Line item added successfully', 201);
});

const listRequestLines = asyncHandler(async (req, res) => {
  const lines = await service.listRequestLines(req.params.requestId);
  return ApiResponse.success(res, lines);
});

// --- RFQs ---
const createRfq = asyncHandler(async (req, res) => {
  const rfq = await service.createRfq(req.body);
  return ApiResponse.success(res, rfq, 'RFQ created successfully', 201);
});

const listRfqs = asyncHandler(async (req, res) => {
  const rfqs = await service.listRfqs(req.params.requestId, req.user);
  return ApiResponse.success(res, rfqs);
});

const getRfq = asyncHandler(async (req, res) => {
  const rfq = await service.getRfq(req.params.rfqId, req.user);
  return ApiResponse.success(res, rfq);
});

const closeRfq = asyncHandler(async (req, res) => {
  const rfq = await service.closeRfq(req.params.rfqId);
  return ApiResponse.success(res, rfq, 'RFQ closed successfully');
});

const inviteVendor = asyncHandler(async (req, res) => {
  const invite = await service.inviteVendor(req.params.rfqId, req.body.vendorId);
  return ApiResponse.success(res, invite, 'Vendor invited successfully', 201);
});

const listInvitedVendors = asyncHandler(async (req, res) => {
  const vendors = await service.listInvitedVendors(req.params.rfqId, req.user);
  return ApiResponse.success(res, vendors);
});

// --- quotations ---
const submitQuotation = asyncHandler(async (req, res) => {
  const quotation = await service.submitQuotation(req.body, req.user, req.file);
  return ApiResponse.success(res, quotation, 'Quotation submitted successfully', 201);
});

const uploadQuotationDocument = asyncHandler(async (req, res) => {
  const quotation = await service.uploadQuotationDocument(req.params.quotationId, req.user, req.file);
  return ApiResponse.success(res, quotation, 'Quotation document uploaded successfully');
});

const downloadQuotationDocument = asyncHandler(async (req, res) => {
  const document = await service.getQuotationDocument(req.params.quotationId, req.user);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.download(document.filePath, document.fileName);
});

const listQuotations = asyncHandler(async (req, res) => {
  const quotations = await service.listQuotations(req.params.rfqId, req.user);
  return ApiResponse.success(res, quotations);
});

const getQuotation = asyncHandler(async (req, res) => {
  const quotation = await service.getQuotation(req.params.quotationId, req.user);
  return ApiResponse.success(res, quotation);
});

const addQuotationLine = asyncHandler(async (req, res) => {
  const quotation = await service.addQuotationLine(req.params.quotationId, req.body, req.user);
  return ApiResponse.success(res, quotation, 'Quotation line added successfully', 201);
});

const decideQuotation = asyncHandler(async (req, res) => {
  const quotation = await service.decideQuotation(req.params.quotationId, req.body.status, req.user);
  return ApiResponse.success(res, quotation, 'Quotation decision recorded successfully');
});

// --- comparisons ---
const addComparison = asyncHandler(async (req, res) => {
  const comparison = await service.addComparison(req.params.rfqId, req.body);
  return ApiResponse.success(res, comparison, 'Comparison score recorded successfully', 201);
});

const listComparisons = asyncHandler(async (req, res) => {
  const comparisons = await service.listComparisons(req.params.rfqId);
  return ApiResponse.success(res, comparisons);
});

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  updateRequestStatus,
  deleteRequest,
  addRequestLine,
  listRequestLines,
  createRfq,
  listRfqs,
  getRfq,
  closeRfq,
  inviteVendor,
  listInvitedVendors,
  submitQuotation,
  uploadQuotationDocument,
  downloadQuotationDocument,
  listQuotations,
  getQuotation,
  addQuotationLine,
  decideQuotation,
  addComparison,
  listComparisons,
};
