const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');
const service = require('./resident-bills.service');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await service.getDuesSummary(req.user);
  return ApiResponse.success(res, summary, 'Dues summary loaded');
});

const getOutstandingDues = asyncHandler(async (req, res) => {
  const dues = await service.getOutstandingDues(req.user);
  return ApiResponse.success(res, dues, 'Outstanding dues loaded');
});

const getPaymentHistory = asyncHandler(async (req, res) => {
  const history = await service.getPaymentHistory(req.user);
  return ApiResponse.success(res, history, 'Payment history loaded');
});

const getBankDetails = asyncHandler(async (req, res) => {
  const details = await service.getBankDetails(req.user);
  return ApiResponse.success(res, details, 'Society bank details loaded');
});

const initiatePayment = asyncHandler(async (req, res) => {
  const result = await service.initiatePayment(req.user, req.body);
  return ApiResponse.success(
    res,
    result,
    result.message || 'Payment initiated successfully',
    result.status === 'VERIFICATION_PENDING' ? 201 : 200
  );
});

const confirmPayment = asyncHandler(async (req, res) => {
  const result = await service.confirmOnlinePayment(req.user, req.params.id, req.body);
  const completed = ['SUCCESS', 'VERIFIED'].includes(result.status);
  return ApiResponse.success(
    res,
    result,
    completed ? 'Payment completed and accounted for' : 'Provider payment status recorded'
  );
});

const cancelPayment = asyncHandler(async (req, res) => {
  const result = await service.cancelPayment(req.user, req.params.id, req.body?.remarks);
  return ApiResponse.success(res, result, 'Payment cancelled successfully');
});

const downloadInvoiceDocument = asyncHandler(async (req, res) => {
  const doc = await service.downloadInvoiceDocument(req.user, req.params.id);
  return res.download(doc.filePath, doc.fileName);
});

const getReceiptDetails = asyncHandler(async (req, res) => {
  const receipt = await service.getReceiptDetails(req.user, req.params.id);
  return ApiResponse.success(res, receipt, 'Receipt details loaded');
});

module.exports = {
  getSummary,
  getOutstandingDues,
  getPaymentHistory,
  getBankDetails,
  initiatePayment,
  confirmPayment,
  cancelPayment,
  downloadInvoiceDocument,
  getReceiptDetails,
};

