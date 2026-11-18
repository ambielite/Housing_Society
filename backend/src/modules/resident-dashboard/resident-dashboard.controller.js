const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');
const service = require('./resident-dashboard.service');
const residentDashboardEvents = require('./residentDashboardEvents');

const streamEvents = asyncHandler(async (req, res) => {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  residentDashboardEvents.subscribe(req.user.id, res);

  const heartbeat = setInterval(() => {
    if (!res.destroyed && !res.writableEnded) res.write(': keep-alive\n\n');
  }, 25000);
  res.on('close', () => clearInterval(heartbeat));
});

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await service.getDashboard(req.user);
  return ApiResponse.success(res, dashboard, 'Resident dashboard loaded');
});

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await service.listResidentNotifications(req.user);
  return ApiResponse.success(res, notifications, 'Resident notifications loaded');
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await service.markResidentNotificationRead(
    req.user,
    req.params.id,
  );
  return ApiResponse.success(res, notification, 'Notification marked as read');
});

module.exports = { getDashboard, listNotifications, markNotificationRead, streamEvents };
