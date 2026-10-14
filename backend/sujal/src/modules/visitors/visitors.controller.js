const service = require('./visitors.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- visitor profiles ---
const createProfile = asyncHandler(async (req, res) => {
  const profile = await service.createProfile(req.body);
  return ApiResponse.success(res, profile, 'Visitor profile created successfully', 201);
});

const listProfiles = asyncHandler(async (req, res) => {
  const profiles = await service.listProfiles(req.query);
  return ApiResponse.success(res, profiles);
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await service.getProfile(req.params.profileId);
  return ApiResponse.success(res, profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await service.updateProfile(req.params.profileId, req.body);
  return ApiResponse.success(res, profile, 'Visitor profile updated successfully');
});

const setBlacklistStatus = asyncHandler(async (req, res) => {
  const profile = await service.setBlacklistStatus(req.params.profileId, req.body.blacklistStatus);
  return ApiResponse.success(res, profile, 'Blacklist status updated successfully');
});

// --- visitor invites ---
const createInvite = asyncHandler(async (req, res) => {
  const invite = await service.createInvite(req.body);
  return ApiResponse.success(res, invite, 'Visitor invite created successfully', 201);
});

const listInvites = asyncHandler(async (req, res) => {
  const invites = await service.listInvites(req.query);
  return ApiResponse.success(res, invites);
});

const getInvite = asyncHandler(async (req, res) => {
  const invite = await service.getInvite(req.params.inviteId);
  return ApiResponse.success(res, invite);
});

const decideInvite = asyncHandler(async (req, res) => {
  const invite = await service.decideInvite(req.params.inviteId, req.body.status);
  return ApiResponse.success(res, invite, 'Invite decision recorded successfully');
});

// --- visitor passes ---
const createPass = asyncHandler(async (req, res) => {
  const pass = await service.createPass(req.body);
  return ApiResponse.success(res, pass, 'Visitor pass created successfully', 201);
});

const listPasses = asyncHandler(async (req, res) => {
  const passes = await service.listPasses(req.query);
  return ApiResponse.success(res, passes);
});

const getPass = asyncHandler(async (req, res) => {
  const pass = await service.getPass(req.params.passId);
  return ApiResponse.success(res, pass);
});

const recordArrival = asyncHandler(async (req, res) => {
  const pass = await service.recordArrival(req.params.passId);
  return ApiResponse.success(res, pass, 'Arrival registered successfully');
});

const recordEntry = asyncHandler(async (req, res) => {
  const pass = await service.recordEntry(req.params.passId, req.body);
  return ApiResponse.success(res, pass, 'Entry recorded successfully');
});

const recordExit = asyncHandler(async (req, res) => {
  const pass = await service.recordExit(req.params.passId, req.body);
  return ApiResponse.success(res, pass, 'Exit recorded successfully');
});

const cancelPass = asyncHandler(async (req, res) => {
  const pass = await service.cancelPass(req.params.passId);
  return ApiResponse.success(res, pass, 'Visitor pass cancelled successfully');
});

// --- gate events ---
const listGateEvents = asyncHandler(async (req, res) => {
  const events = await service.listGateEvents(req.query);
  return ApiResponse.success(res, events);
});

// --- overstay alerts ---
const triggerOverstay = asyncHandler(async (req, res) => {
  const alert = await service.triggerOverstay(req.params.passId, req.body);
  return ApiResponse.success(res, alert, 'Overstay alert triggered successfully', 201);
});

const listOverstayAlerts = asyncHandler(async (req, res) => {
  const alerts = await service.listOverstayAlerts(req.query);
  return ApiResponse.success(res, alerts);
});

const acknowledgeOverstayAlert = asyncHandler(async (req, res) => {
  const alert = await service.acknowledgeOverstayAlert(req.params.alertId, req.user.id, req.body.status);
  return ApiResponse.success(res, alert, 'Overstay alert updated successfully');
});

module.exports = {
  createProfile,
  listProfiles,
  getProfile,
  updateProfile,
  setBlacklistStatus,
  createInvite,
  listInvites,
  getInvite,
  decideInvite,
  createPass,
  listPasses,
  getPass,
  recordArrival,
  recordEntry,
  recordExit,
  cancelPass,
  listGateEvents,
  triggerOverstay,
  listOverstayAlerts,
  acknowledgeOverstayAlert,
};
