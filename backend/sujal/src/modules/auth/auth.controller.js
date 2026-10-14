const authService = require('./auth.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

const buildMeta = (req) => ({ ipAddress: req.ip, deviceInfo: req.headers['user-agent'] });

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return ApiResponse.success(res, user, 'User registered successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, buildMeta(req));
  return ApiResponse.success(res, result, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body);
  return ApiResponse.success(res, tokens, 'Token refreshed successfully');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body);
  return ApiResponse.success(res, null, 'Logged out successfully');
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  return ApiResponse.success(res, null, 'Logged out from all devices');
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id, req.user.societyId);
  return ApiResponse.success(res, profile);
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  return ApiResponse.success(res, null, 'Password changed successfully. Please log in again.');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return ApiResponse.success(res, result, 'Request processed');
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return ApiResponse.success(res, null, 'Password reset successfully');
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
};
