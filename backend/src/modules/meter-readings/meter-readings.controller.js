const service = require('./meter-readings.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- readings ---
const submitReading = asyncHandler(async (req, res) => {
  const reading = await service.submitReading({ ...req.body, capturedBy: req.user.id });
  return ApiResponse.success(res, reading, 'Meter reading submitted successfully', 201);
});

const submitEstimatedReading = asyncHandler(async (req, res) => {
  const reading = await service.submitEstimatedReading({ ...req.body, capturedBy: req.user.id });
  return ApiResponse.success(res, reading, 'Estimated reading recorded successfully', 201);
});

/**
 * Bulk submission ("Manual, bulk and future device-based readings").
 * Every row goes through the exact same validation as a single
 * submission (including the no-lower-than-previous rule). A bad row
 * does not abort the batch - each row reports its own success/error so
 * you can fix and resubmit only the failures.
 */
const submitBulkReadings = asyncHandler(async (req, res) => {
  const results = [];
  for (let i = 0; i < req.body.readings.length; i += 1) {
    const row = req.body.readings[i];
    try {
      const reading = await service.submitReading({ ...row, source: 'BULK', capturedBy: req.user.id });
      results.push({ index: i, success: true, reading });
    } catch (err) {
      results.push({ index: i, success: false, meterId: row.meterId, error: err.message });
    }
  }
  const succeeded = results.filter((r) => r.success).length;
  return ApiResponse.success(
    res,
    { total: results.length, succeeded, failed: results.length - succeeded, results },
    'Bulk readings processed',
    201
  );
});

const listReadings = asyncHandler(async (req, res) => {
  const readings = await service.listReadings(req.query);
  return ApiResponse.success(res, readings);
});

const getReading = asyncHandler(async (req, res) => {
  const reading = await service.getReading(req.params.readingId);
  return ApiResponse.success(res, reading);
});

const validateReading = asyncHandler(async (req, res) => {
  const result = await service.validateReading(req.params.readingId);
  return ApiResponse.success(res, result, 'Reading validated successfully');
});

const rejectReading = asyncHandler(async (req, res) => {
  const reading = await service.rejectReading(req.params.readingId, req.body.remarks);
  return ApiResponse.success(res, reading, 'Reading rejected');
});

const adjustReading = asyncHandler(async (req, res) => {
  const reading = await service.adjustReading(req.params.readingId, req.body);
  return ApiResponse.success(res, reading, 'Reading adjusted successfully - resubmitted for validation');
});

// --- utility bills ---
const createBill = asyncHandler(async (req, res) => {
  const bill = await service.createBillFromReading(req.body.readingId);
  return ApiResponse.success(res, bill, 'Utility bill calculated successfully', 201);
});

const listBillsForMeter = asyncHandler(async (req, res) => {
  const bills = await service.listBillsForMeter(req.params.meterId);
  return ApiResponse.success(res, bills);
});

const getBill = asyncHandler(async (req, res) => {
  const bill = await service.getBill(req.params.billId);
  return ApiResponse.success(res, bill);
});

const linkBill = asyncHandler(async (req, res) => {
  const bill = await service.linkBillToInvoice(req.params.billId, req.body);
  return ApiResponse.success(res, bill, 'Utility bill linked successfully');
});

module.exports = {
  submitReading,
  submitEstimatedReading,
  submitBulkReadings,
  listReadings,
  getReading,
  validateReading,
  rejectReading,
  adjustReading,
  createBill,
  listBillsForMeter,
  getBill,
  linkBill,
};
