const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');
const service = require('./resident-complaints.service');

const listCategories = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    await service.listCategories(req.user),
    'Complaint categories loaded',
  );
});

const listComplaints = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    await service.listComplaints(req.user),
    'Your complaints loaded',
  );
});

const createComplaint = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    await service.createComplaint(req.user, req.body),
    'Complaint submitted successfully',
    201,
  );
});

const getComplaint = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    await service.getComplaint(req.user, req.params.ticketId),
    'Complaint loaded',
  );
});

module.exports = { listCategories, listComplaints, createComplaint, getComplaint };
