const service = require('./sla.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

const getTimerForTicket = asyncHandler(async (req, res) => {
  const timer = await service.getTimerForTicket(req.params.ticketId);
  return ApiResponse.success(res, timer);
});

const listEscalationsForTicket = asyncHandler(async (req, res) => {
  const escalations = await service.listEscalationsForTicket(req.params.ticketId);
  return ApiResponse.success(res, escalations);
});

const acknowledgeEscalation = asyncHandler(async (req, res) => {
  const escalation = await service.acknowledgeEscalation(req.params.escalationId);
  return ApiResponse.success(res, escalation, 'Escalation acknowledged successfully');
});

const resolveEscalation = asyncHandler(async (req, res) => {
  const escalation = await service.resolveEscalation(req.params.escalationId);
  return ApiResponse.success(res, escalation, 'Escalation resolved successfully');
});

module.exports = {
  getTimerForTicket,
  listEscalationsForTicket,
  acknowledgeEscalation,
  resolveEscalation,
};
