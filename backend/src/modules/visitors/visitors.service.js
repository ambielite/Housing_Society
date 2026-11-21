const ApiError = require('../../common/ApiError');
const { query } = require('../../config/db');
const repository = require('./visitors.repository');
const gatesRepository = require('../gates/gates.repository');
const deliveriesRepository = require('../deliveries/deliveries.repository');

const requireResidentId = async (user) => {
  if (!user.societyId) {
    throw new ApiError(403, 'Your account is not linked to a society');
  }
  const result = await query(
    `SELECT id
       FROM residents
      WHERE user_id = $1 AND society_id = $2 AND status = 'ACTIVE'
      LIMIT 1`,
    [user.id, user.societyId],
  );
  const resident = result.rows[0];
  if (!resident) {
    throw new ApiError(403, 'Your resident profile is not linked to this account');
  }
  return resident.id;
};

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

const createProfile = async (payload) => {
  if (payload.visitorType === 'MAID') {
    const result = await query(
      `SELECT id
         FROM staff
        WHERE society_id = $1
          AND staff_type = 'MAID'
          AND status = 'ACTIVE'
          AND upper(trim(employee_code)) = upper(trim($2))
          AND lower(regexp_replace(trim(concat_ws(' ', first_name, last_name)), '\\s+', ' ', 'g'))
              = lower(regexp_replace(trim($3), '\\s+', ' ', 'g'))
          AND right(regexp_replace(mobile_number, '\\D', '', 'g'), 10)
              = right(regexp_replace($4, '\\D', '', 'g'), 10)
        LIMIT 2`,
      [payload.societyId, payload.employeeCode, payload.name, payload.phone],
    );
    if (result.rowCount !== 1) {
      throw new ApiError(
        400,
        'Maid name, phone number, and employee code must match an active Maid in this society.',
      );
    }
  }
  return repository.createProfile(payload);
};

const listProfiles = (query) => repository.listProfiles(query);
const listDestinations = (societyId) => repository.listDestinations(societyId);

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

const createResidentInvite = async (user, { name, phone, visitorType, expectedFrom, expectedUntil, purpose }) => {
  const residentId = await requireResidentId(user);
  const societyId = user.societyId;
  const destinations = await repository.listDestinations(societyId);
  const destination = destinations.find((item) => item.resident_id === residentId);
  if (!destination) throw new ApiError(403, 'Your account is not linked to an active home');
  const profile = await repository.createProfile({ societyId, name, phone, visitorType });
  const invite = await repository.createInvite({
    societyId, invitedBy: user.id, unitId: destination.unit_id,
    visitorProfileId: profile.id, expectedFrom, expectedUntil, purpose,
  });
  await repository.updateInviteStatus(invite.id, 'APPROVED');
  const [gate] = await gatesRepository.listGates(societyId);
  if (!gate) throw new ApiError(409, 'No active gate is configured for this society');
  await repository.createPass({
    inviteId: invite.id, visitorProfileId: profile.id, gateId: gate.id,
    passNo: invite.id, unitId: destination.unit_id, residentId,
  });
  return invite;
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
const createPass = async ({ inviteId, visitorProfileId, gateId, passNo, unitId, residentId }) => {
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
  if (profile.society_id !== gate.society_id) {
    throw new ApiError(400, 'The visitor profile and gate must belong to the same society');
  }
  if (unitId || residentId) {
    if (!unitId || !residentId || !await repository.destinationBelongsToSociety({
      societyId: gate.society_id,
      unitId,
      residentId,
    })) {
      throw new ApiError(400, 'Select an active resident and flat in this society');
    }
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

  return repository.createPass({ inviteId, visitorProfileId, gateId, passNo, unitId, residentId });
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
  if (pass.resident_decision === 'REJECTED') {
    throw new ApiError(400, 'The resident rejected this visitor request');
  }
  const updated = await repository.updatePassStatus(id, 'ARRIVED');
  await deliveriesRepository.syncStatusFromVisitorPass(id, 'ARRIVED');
  return updated;
};

// Link a maid visitor pass to one active staff record using employee code,
// name, and phone within the gate's society.
const syncMaidAttendance = async (pass, direction, capturedBy) => {
  const result = await query(
    `SELECT pf.name, pf.phone, pf.employee_code, pf.visitor_type, g.society_id
       FROM visitor_profiles pf
       JOIN visitor_passes vp ON vp.visitor_profile_id = pf.id
       JOIN gates g ON g.id = vp.gate_id
      WHERE vp.id = $1`,
    [pass.id],
  );
  const visitor = result.rows[0];
  if (!visitor || visitor.visitor_type !== 'MAID') return;

  const matches = await query(
    `SELECT s.id, s.mobile_number
       FROM staff s
      WHERE s.society_id = $1
        AND s.staff_type = 'MAID'
        AND s.status = 'ACTIVE'
        AND upper(trim(s.employee_code)) = upper(trim($2))
        AND lower(regexp_replace(trim(concat_ws(' ', s.first_name, s.last_name)), '\\s+', ' ', 'g'))
            = lower(regexp_replace(trim($3), '\\s+', ' ', 'g'))
        AND right(regexp_replace(s.mobile_number, '\\D', '', 'g'), 10)
            = right(regexp_replace($4, '\\D', '', 'g'), 10)
      LIMIT 2`,
    [visitor.society_id, visitor.employee_code, visitor.name, visitor.phone],
  );
  if (matches.rowCount !== 1) return;

  const staffId = matches.rows[0].id;
  if (direction === 'ENTRY') {
    await query(
      `INSERT INTO staff_attendance
         (staff_id, attendance_date, check_in_time, status, marked_by, remarks, created_at, updated_at)
       VALUES (
         $1,
         (now() AT TIME ZONE 'Asia/Kolkata')::date,
         now(),
         'PRESENT',
         $2,
         'Check-in recorded from approved maid visitor pass',
         now(),
         now()
       )
       ON CONFLICT (staff_id, attendance_date) DO UPDATE
         SET check_in_time = COALESCE(staff_attendance.check_in_time, EXCLUDED.check_in_time),
             status = CASE WHEN staff_attendance.check_in_time IS NULL THEN 'PRESENT' ELSE staff_attendance.status END,
             marked_by = COALESCE(staff_attendance.marked_by, EXCLUDED.marked_by),
             updated_at = now()`,
      [staffId, capturedBy || null],
    );
    return;
  }

  await query(
    `WITH active_attendance AS (
       SELECT id, check_in_time
         FROM staff_attendance
        WHERE staff_id = $1
          AND check_in_time IS NOT NULL
          AND check_out_time IS NULL
        ORDER BY attendance_date DESC
        LIMIT 1
     )
     UPDATE staff_attendance attendance
        SET check_out_time = now(),
            working_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - attendance.check_in_time)) / 60)::integer),
            updated_at = now()
       FROM active_attendance
      WHERE attendance.id = active_attendance.id`,
    [staffId],
  );
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
  if (pass.resident_decision === 'PENDING' || pass.resident_decision === 'REJECTED') {
    throw new ApiError(
      400,
      pass.resident_decision === 'REJECTED'
        ? 'The resident rejected this visitor request'
        : 'Wait for the resident to approve this visitor before entry',
    );
  }

  await syncMaidAttendance(pass, 'ENTRY', capturedBy);

  await repository.createGateEvent({
    societyId: (await gatesRepository.findGateById(pass.gate_id)).society_id,
    gateId: pass.gate_id,
    visitorPassId: id,
    eventType: 'ENTRY',
    capturedBy,
  });

  const updated = await repository.updatePassStatus(id, 'INSIDE');
  await deliveriesRepository.syncStatusFromVisitorPass(id, 'INSIDE');
  return updated;
};

const listResidentVisitorRequests = async (user) => {
  const residentId = await requireResidentId(user);
  return repository.listResidentVisitorRequests({
    residentId,
    societyId: user.societyId,
  });
};

const listResidentVisitorHistory = async (user) => {
  const residentId = await requireResidentId(user);
  return repository.listResidentVisitorHistory({
    residentId,
    societyId: user.societyId,
  });
};

const decideResidentVisitorRequest = async (user, passId, decision) => {
  const residentId = await requireResidentId(user);
  const updated = await repository.decideResidentVisitorRequest({
    passId,
    residentId,
    societyId: user.societyId,
    decision,
  });
  if (!updated) throw new ApiError(404, 'Pending visitor request not found');
  if (decision === 'REJECTED') {
    await deliveriesRepository.syncStatusFromVisitorPass(passId, 'CANCELLED');
  }
  return updated;
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

  await syncMaidAttendance(pass, 'EXIT', capturedBy);

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
  listDestinations,
  getProfile,
  updateProfile,
  setBlacklistStatus,
  createInvite,
  createResidentInvite,
  listInvites,
  getInvite,
  decideInvite,
  createPass,
  listResidentVisitorRequests,
  listResidentVisitorHistory,
  decideResidentVisitorRequest,
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
