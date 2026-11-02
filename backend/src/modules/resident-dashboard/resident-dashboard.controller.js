const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');
const service = require('./resident-dashboard.service');

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await service.getDashboard(req.user);
  return ApiResponse.success(res, dashboard, 'Resident dashboard loaded');
});

module.exports = { getDashboard };
