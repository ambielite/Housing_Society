const ApiError = require('../../common/ApiError');
const repository = require('./visitors.repository');
const gatesRepository = require('../gates/gates.repository');

/**
 * Implements the Visitor Lifecycle exactly as documented:
 * Pre-approved/Walk-in created -> Arrival registered -> Resident/guard
 * decision -> Entry recorded -> Inside-premises timer begins -> Exit
 * recorded or overstay triggered -> Audit record finalized.
 *
 * Mapping to endpoints:
 *   "Pre-approved... created"  -> createInvite (pre-approval) OR
 *                                  createPass with no inviteId (walk-in)
 *   "Arrival registered"       -> recordArrival (pass: EXPECTED -> ARRIVED)
 *   "Resident/guard decision"  -> decideInvite (for pre-approved visitors)
 *   "Entry recorded" +
 *   "Inside-premises timer"    -> recordEntry (pass: -> INSIDE, gate_event ENTRY)
 *   "Exit recorded /overstay"  -> recordExit (pass: -> EXITED, gate_event EXIT)
 *                                  OR triggerOverstay (pass: -> OVERSTAY)
 *   "Audit record finalized"   -> the gate_events rows themselves are the
 *                                  immutable audit trail; nothing further to do.
 */

// --- visitor profiles --------------------------------------------------------

const createProfile = (payload) => repository.createProfile(payload);

const listProfiles = (query) => repository.listProfiles(query);

const getProfile = async (id) => {
  const profile = await repository.findProfileById(id);
  if (!profile) {
    throw new ApiError(404, 'Visitor profile not found');
  }
  return profile;
};

const updateProfile = async (id, payload) => {
  const profile = await repository.findProfileById(id);
  if (!profile) {
    throw new ApiError(404, 'Visitor profile not found');
  }
  return repository.updateProfile(id, payload);
};

const setBlacklistStatus = async (id, blacklistStatus) => {
  const profile = await repository.findProfileById(id);
  if (!profile) {
    throw new ApiError(404, 'Visitor profile not found');
  }
  return repository.updateBlacklistStatus(id, blacklistStatus);
};

// --- visitor invites (pre-approval) -------------------------------------------

const createInvite = async ({ societyId, invitedBy, unitId, visitorProfileId, expectedFrom, expectedUntil, purpose }) => {
  const profile = await repository.findProfileById(visitorProfileId);
  if (!profile) {
    throw new ApiError(404, 'Visitor profile not found');
  }
  if (profile.blacklist_status === 'BLACKLISTED') {
    throw new ApiError(400, 'This visitor is blacklisted and cannot be pre-approved');
  }
  return repository.createInvite({ societyId, invitedBy, unitId, visitorProfileId, expectedFrom, expectedUntil, purpose });
};

const listInvites = (query) => repository.listInvites(query);

const getInvite = async (id) => {
  const invite = await repository.findInviteById(id);
  if (!invite) {
    throw new ApiError(404, 'Visitor invite not found');
  }
  return invite;
};

/** "Resident/guard decision" step of the lifecycle for pre-approved visitors. */
const decideInvite = async (id, status) => {
  const invite = await repository.findInviteById(id);
  if (!invite) {
    throw new ApiError(404, 'Visitor invite not found');
  }
  if (invite.status !== 'PENDING') {
    throw new ApiError(400, `This invite is already ${invite.status}`);
  }
  return repository.updateInviteStatus(id, status);
};

// --- visitor passes (the actual gate-facing lifecycle) --------------------------

/**
 * Creates a pass. inviteId present = pre-approved visitor (invite must
 * be APPROVED). inviteId absent = walk-in, created directly by a guard.
 * This single function covers "Pre-approved/Walk-in created".
 */
const createPass = async ({ inviteId, visitorProfileId, gateId, passNo }) => {
  const profile = await repository.findProfileById(visitorProfileId);
  if (!profile) {
    throw new ApiError(404, 'Visitor profile not found');
  }
  if (profile.blacklist_status === 'BLACKLISTED') {
    throw new ApiError(400, 'This visitor is blacklisted and cannot be issued a pass');
  }

  const gate = await gatesRepository.findGateById(gateId);
  if (!gate) {
    throw new ApiError(404, 'Gate not found');
  }

  if (inviteId) {
    const invite = await repository.findInviteById(inviteId);
    if (!invite) {
      throw new ApiError(404, 'Visitor invite not found');
    }
    if (invite.status !== 'APPROVED') {
      throw new ApiError(400, 'Only an APPROVED invite can be converted into a visitor pass');
    }
  }

  return repository.createPass({ inviteId, visitorProfileId, gateId, passNo });
};

const listPasses = (query) => repository.listPasses(query);

const getPass = async (id) => {
  const pass = await repository.findPassById(id);
  if (!pass) {
    throw new ApiError(404, 'Visitor pass not found');
  }
  return pass;
};

/** "Arrival registered" step. */
const recordArrival = async (id) => {
  const pass = await repository.findPassById(id);
  if (!pass) {
    throw new ApiError(404, 'Visitor pass not found');
  }
  if (pass.status !== 'EXPECTED') {
    throw new ApiError(400, `Cannot register arrival - pass is currently ${pass.status}`);
  }
  return repository.updatePassStatus(id, 'ARRIVED');
};

/** "Entry recorded" + "Inside-premises timer begins" steps. */
const recordEntry = async (id, { capturedBy }) => {
  const pass = await repository.findPassById(id);
  if (!pass) {
    throw new ApiError(404, 'Visitor pass not found');
  }
  if (pass.status !== 'ARRIVED' && pass.status !== 'EXPECTED') {
    throw new ApiError(400, `Cannot record entry - pass is currently ${pass.status}`);
  }

  await repository.createGateEvent({
    societyId: (await gatesRepository.findGateById(pass.gate_id)).society_id,
    gateId: pass.gate_id,
    visitorPassId: id,
    eventType: 'ENTRY',
    capturedBy,
  });

  return repository.updatePassStatus(id, 'INSIDE');
};

/** "Exit recorded" branch of the lifecycle's final step. */
const recordExit = async (id, { capturedBy }) => {
  const pass = await repository.findPassById(id);
  if (!pass) {
    throw new ApiError(404, 'Visitor pass not found');
  }
  if (pass.status !== 'INSIDE' && pass.status !== 'OVERSTAY') {
    throw new ApiError(400, `Cannot record exit - pass is currently ${pass.status}`);
  }

  await repository.createGateEvent({
    societyId: (await gatesRepository.findGateById(pass.gate_id)).society_id,
    gateId: pass.gate_id,
    visitorPassId: id,
    eventType: 'EXIT',
    capturedBy,
  });

  return repository.updatePassStatus(id, 'EXITED');
};

const cancelPass = async (id) => {
  const pass = await repository.findPassById(id);
  if (!pass) {
    throw new ApiError(404, 'Visitor pass not found');
  }
  if (pass.status === 'EXITED' || pass.status === 'CANCELLED') {
    throw new ApiError(400, `Cannot cancel a pass that is already ${pass.status}`);
  }
  return repository.updatePassStatus(id, 'CANCELLED');
};

// --- gate events (read-only audit trail) --------------------------------------

const listGateEvents = (query) => repository.listGateEvents(query);

// --- overstay alerts ("...or overstay triggered" branch) ------------------------

/**
 * No background scheduler exists yet (same caveat as every other phase),
 * so overstay detection is a manual/explicit call rather than an
 * automatic timer - a guard, admin, or a future scheduled job calls this
 * once a pass has been INSIDE longer than the configured threshold.
 */
const triggerOverstay = async (passId, { durationMinutes }) => {
  const pass = await repository.findPassById(passId);
  if (!pass) {
    throw new ApiError(404, 'Visitor pass not found');
  }
  if (pass.status !== 'INSIDE') {
    throw new ApiError(400, 'Overstay can only be triggered for a pass that is currently INSIDE');
  }
  const alert = await repository.createOverstayAlert({ visitorPassId: passId, durationMinutes });
  await repository.updatePassStatus(passId, 'OVERSTAY');
  return alert;
};

const listOverstayAlerts = (query) => repository.listOverstayAlerts(query);

const acknowledgeOverstayAlert = async (id, acknowledgedBy, status) => {
  const alert = await repository.findOverstayAlertById(id);
  if (!alert) {
    throw new ApiError(404, 'Overstay alert not found');
  }
  if (alert.status !== 'OPEN') {
    throw new ApiError(400, `This alert is already ${alert.status}`);
  }
  return repository.acknowledgeOverstayAlert(id, acknowledgedBy, status);
};

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
