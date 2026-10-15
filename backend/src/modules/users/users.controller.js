const service = require('./users.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const result = await service.listUsers(req.query);
  return ApiResponse.success(res, result, 'Users fetched successfully');
});

const getUser = asyncHandler(async (req, res) => {
  const user = await service.getUserById(req.params.userId);
  return ApiResponse.success(res, user);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await service.createUser(req.body);
  return ApiResponse.success(res, user, 'User created successfully', 201);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await service.updateProfile(req.params.userId, req.body);
  return ApiResponse.success(res, user, 'User updated successfully');
});

const updateStatus = asyncHandler(async (req, res) => {
  const user = await service.updateStatus(req.params.userId, req.body.status);
  return ApiResponse.success(res, user, 'User status updated successfully');
});

const archiveUser = asyncHandler(async (req, res) => {
  const user = await service.archiveUser(req.params.userId);
  return ApiResponse.success(res, user, 'User archived successfully');
});

const forceLogout = asyncHandler(async (req, res) => {
  await service.forceLogout(req.params.userId);
  return ApiResponse.success(res, null, 'All active sessions for this user have been revoked');
});

const getLoginHistory = asyncHandler(async (req, res) => {
  const history = await service.getLoginHistory(req.params.userId);
  return ApiResponse.success(res, history);
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateProfile,
  updateStatus,
  archiveUser,
  forceLogout,
  getLoginHistory,
};
