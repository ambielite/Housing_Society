const service = require('./approvals.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

const raiseApproval = asyncHandler(async (req, res) => {
  const request = await service.raiseApproval(req.body);
  return ApiResponse.success(res, request, 'Approval request raised successfully', 201);
});

const listRequests = asyncHandler(async (req, res) => {
  const requests = await service.listRequests(req.query);
  return ApiResponse.success(res, requests);
});

const getRequest = asyncHandler(async (req, res) => {
  const request = await service.getRequest(req.params.approvalRequestId);
  return ApiResponse.success(res, request);
});

const decide = asyncHandler(async (req, res) => {
  const request = await service.decide({
    approvalRequestId: req.params.approvalRequestId,
    approverId: req.user.id,
    ...req.body,
  });
  return ApiResponse.success(res, request, 'Decision recorded successfully');
});

const cancel = asyncHandler(async (req, res) => {
  const request = await service.cancel(req.params.approvalRequestId);
  return ApiResponse.success(res, request, 'Approval request cancelled successfully');
});

module.exports = { raiseApproval, listRequests, getRequest, decide, cancel };
