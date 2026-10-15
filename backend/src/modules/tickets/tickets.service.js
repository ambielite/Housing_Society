const crypto = require('crypto');
const ApiError = require('../../common/ApiError');
const repository = require('./tickets.repository');
const helpdeskSetupRepository = require('../helpdesk-setup/helpdesk-setup.repository');
const slaService = require('../sla/sla.service');
const vendorsRepository = require('../vendors/vendors.repository');
const usersRepository = require('../users/users.repository');

const generateTicketNo = () => `TKT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Strict state machine per the spec:
 * OPEN -> ASSIGNED -> IN_PROGRESS -> ON_HOLD -> RESOLVED -> CLOSED
 * ON_HOLD <-> IN_PROGRESS is the documented pause/resume branch
 * ("Pause timers for configured states such as Awaiting Resident
 * Response"). No other jumps are permitted - this is deliberately
 * strict, matching the doc's own wording.
 */
const ALLOWED_TRANSITIONS = {
  OPEN: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['ON_HOLD', 'RESOLVED'],
  ON_HOLD: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

// --- tickets --------------------------------------------------------------------

const createTicket = async ({ societyId, categoryId, raisedBy, unitId, subject, description, priority }) => {
  const category = await helpdeskSetupRepository.findCategoryById(categoryId);
  if (!category) {
    throw new ApiError(404, 'Ticket category not found');
  }

  const ticketNo = generateTicketNo();
  const finalPriority = priority || category.default_priority;

  const ticket = await repository.createTicket({
    societyId,
    ticketNo,
    categoryId,
    raisedBy,
    unitId,
    subject,
    description,
    priority: finalPriority,
  });

  await repository.addStatusHistory({ ticketId: ticket.id, oldStatus: null, newStatus: 'OPEN', changedBy: raisedBy });

  // Wire up the SLA timer if this category has a policy attached.
  if (category.sla_policy_id) {
    const policy = await helpdeskSetupRepository.findPolicyById(category.sla_policy_id);
    if (policy) {
      await slaService.startTimer(ticket.id, policy);
    }
  }

  return ticket;
};

/** A restricted scope object prevents an unlinked VENDOR login from falling back to society-wide data. */
const listTickets = (query, vendorScope) => {
  if (vendorScope?.restricted && !vendorScope.vendorId) return [];
  return repository.listTickets({ ...query, vendorId: vendorScope?.restricted ? vendorScope.vendorId : undefined });
};

const assertVendorCanAccess = async (ticketId, vendorScope) => {
  if (!vendorScope?.restricted) return;
  if (!vendorScope.vendorId) throw new ApiError(404, 'Ticket not found');
  const [assignment, vendor, ticket] = await Promise.all([
    repository.findActiveAssignment(ticketId),
    vendorsRepository.findById(vendorScope.vendorId),
    repository.findById(ticketId),
  ]);
  if (!assignment || assignment.assigned_vendor_id !== vendorScope.vendorId || !vendor || !ticket || vendor.society_id !== ticket.society_id) {
    throw new ApiError(404, 'Ticket not found');
  }
};

const getTicket = async (id, vendorScope) => {
  const ticket = await repository.findById(id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(id, vendorScope);

  // Check-on-read SLA breach + escalation refresh.
  const timer = await slaService.refreshTicketSla(id);

  return { ...ticket, slaTimer: timer };
};

const updateTicket = async (id, payload, vendorScope) => {
  const ticket = await repository.findById(id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(id, vendorScope);
  return repository.updateTicket(id, payload);
};

const updateStatus = async (id, newStatus, changedBy, remarks, vendorScope) => {
  const ticket = await repository.findById(id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(id, vendorScope);

  const allowed = ALLOWED_TRANSITIONS[ticket.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Cannot move a ${ticket.status} ticket to ${newStatus}`);
  }

  const timestamps = {};
  if (newStatus === 'RESOLVED') timestamps.resolvedAt = new Date();
  if (newStatus === 'CLOSED') timestamps.closedAt = new Date();

  const updated = await repository.updateStatus(id, newStatus, timestamps);
  await repository.addStatusHistory({ ticketId: id, oldStatus: ticket.status, newStatus, changedBy, remarks });

  // SLA pause/resume around the ON_HOLD branch.
  if (newStatus === 'ON_HOLD') {
    const category = await helpdeskSetupRepository.findCategoryById(ticket.category_id);
    const policy = category?.sla_policy_id ? await helpdeskSetupRepository.findPolicyById(category.sla_policy_id) : null;
    if (policy?.pause_on_waiting) {
      await slaService.pauseTimer(id);
    }
  } else if (ticket.status === 'ON_HOLD' && newStatus === 'IN_PROGRESS') {
    await slaService.resumeTimer(id);
  } else if (newStatus === 'RESOLVED') {
    await slaService.markMet(id);
  }

  return updated;
};

const deleteTicket = async (id, vendorScope) => {
  const ticket = await repository.findById(id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(id, vendorScope);
  return repository.deleteTicket(id);
};

// --- assignments -----------------------------------------------------------------

const assignTicket = async (ticketId, { assignedToUserId, assignedVendorId }, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  if (!assignedToUserId && !assignedVendorId) {
    throw new ApiError(400, 'Provide at least one of assignedToUserId or assignedVendorId');
  }

  const current = await repository.findActiveAssignment(ticketId);
  let finalVendorId = assignedVendorId || null;
  if (finalVendorId) {
    const vendor = await vendorsRepository.findById(finalVendorId);
    if (!vendor) throw new ApiError(404, 'Vendor not found');
    if (vendor.society_id !== ticket.society_id) throw new ApiError(400, 'The ticket and assigned vendor must belong to the same society');
  }

  if (assignedToUserId) {
    const targetUser = await usersRepository.findById(assignedToUserId);
    if (!targetUser) throw new ApiError(404, 'Assigned user not found');
    if (targetUser.society_id && targetUser.society_id !== ticket.society_id) {
      throw new ApiError(400, 'The ticket and assigned user must belong to the same society');
    }
    const linkedVendor = await vendorsRepository.findByUserId(assignedToUserId);
    if (linkedVendor) {
      const expectedVendorId = finalVendorId || current?.assigned_vendor_id || linkedVendor.id;
      if (linkedVendor.id !== expectedVendorId) {
        throw new ApiError(400, 'A vendor task can only be assigned to a user linked to that same vendor');
      }
      finalVendorId = expectedVendorId;
    } else if (!finalVendorId && current?.assigned_vendor_id) {
      finalVendorId = current.assigned_vendor_id;
    }
  }

  if (current) {
    await repository.unassign(current.id);
  }

  const assignment = await repository.createAssignment({ ticketId, assignedToUserId, assignedVendorId: finalVendorId });

  if (ticket.status === 'OPEN') {
    await updateStatus(ticketId, 'ASSIGNED', assignedToUserId || null, 'Auto-transitioned on assignment', vendorScope);
  }

  return assignment;
};

const unassignTicket = async (ticketId, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  await assertVendorCanAccess(ticketId, vendorScope);
  const current = await repository.findActiveAssignment(ticketId);
  if (!current) {
    throw new ApiError(400, 'This ticket has no active assignment');
  }
  return repository.unassign(current.id);
};

const listAssignments = async (ticketId, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  return repository.listAssignments(ticketId, vendorScope?.restricted ? vendorScope.vendorId : undefined);
};

// --- comments ------------------------------------------------------------------------

const addComment = async (ticketId, { authorId, comment, isInternal }, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  return repository.addComment({ ticketId, authorId, comment, isInternal: vendorScope?.restricted ? false : isInternal });
};

/** includeInternal should be false for a VENDOR-only caller (internal notes are staff-only). */
const listComments = async (ticketId, includeInternal, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  return repository.listComments(ticketId, includeInternal);
};

// --- attachments ---------------------------------------------------------------------

const addAttachment = async (ticketId, documentId, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  return repository.addAttachment({ ticketId, documentId });
};

const listAttachments = async (ticketId, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  return repository.listAttachments(ticketId);
};

// --- status history ------------------------------------------------------------------

const listStatusHistory = async (ticketId, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  return repository.listStatusHistory(ticketId);
};

// --- ratings --------------------------------------------------------------------------

const addRating = async (ticketId, { ratedBy, rating, comment }, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  if (ticket.status !== 'CLOSED') {
    throw new ApiError(400, 'Only a CLOSED ticket can be rated');
  }
  const existing = await repository.findRatingByTicketId(ticketId);
  if (existing) {
    throw new ApiError(409, 'This ticket has already been rated');
  }
  return repository.addRating({ ticketId, ratedBy, rating, comment });
};

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  updateStatus,
  deleteTicket,
  assignTicket,
  unassignTicket,
  listAssignments,
  addComment,
  listComments,
  addAttachment,
  listAttachments,
  listStatusHistory,
  addRating,
};
