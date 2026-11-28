const crypto = require('crypto');
const ApiError = require('../../common/ApiError');
const repository = require('./tickets.repository');
const helpdeskSetupRepository = require('../helpdesk-setup/helpdesk-setup.repository');
const slaService = require('../sla/sla.service');
const vendorsRepository = require('../vendors/vendors.repository');
const usersRepository = require('../users/users.repository');
const { publishTicketStatusChanged } = require('./tickets.events');
const securityEvents = require('../gates/securityEvents');
const { notifySocietyAdmins } = require('../notifications/notification/adminActivityNotification');
const { notifyResidentUser } = require('../notifications/notification/residentActivityNotification');

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

const createTicket = async ({ societyId, categoryId, raisedBy, unitId, subject, description, priority }, actor) => {
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

  const isResident = actor?.roles?.some((role) =>
    ['RESIDENT', 'RESIDENT_APP'].includes(role),
  );
  if (isResident) {
    await notifySocietyAdmins({
      societyId: ticket.society_id,
      title: 'New resident ticket',
      message: `A resident submitted ticket ${ticket.ticket_no}${ticket.subject ? `: ${ticket.subject}` : ''}${category.name ? ` (${category.name})` : ''}.`,
      referenceType: 'TICKET',
      referenceId: ticket.id,
      data: {
        ticketId: ticket.id,
        ticketNo: ticket.ticket_no,
        subject: ticket.subject,
        categoryName: category.name,
        status: ticket.status,
      },
      excludeUserId: actor.id,
    });
  }

  return ticket;
};

const requireAssignedStaff = async (user) => {
  if (!user?.id || !user?.societyId) {
    throw new ApiError(403, 'This account is not linked to a staff profile');
  }
  const staff = await repository.findStaffIdForUser(
    user.id,
    user.societyId,
    user.guardEmployeeCode,
  );
  if (!staff) throw new ApiError(403, 'This account is not linked to an active staff profile');
  return staff.id;
};

const listAssignedStaffTickets = async (user) => {
  const staffId = await requireAssignedStaff(user);
  return repository.listAssignedStaffTickets(staffId, user.id);
};

const updateAssignedStaffTicketStatus = async (user, ticketId, status, remarks) => {
  const staffId = await requireAssignedStaff(user);
  if (!['IN_PROGRESS', 'ON_HOLD', 'RESOLVED'].includes(status)) {
    throw new ApiError(400, 'Staff can set a ticket to In Progress, On Hold, or Complete');
  }
  const assignment = await repository.findActiveAssignmentForStaff(ticketId, staffId, user.id);
  if (!assignment) throw new ApiError(404, 'This ticket is not assigned to your staff profile');
  const updated = await updateStatus(ticketId, status, user.id, remarks || 'Updated by assigned staff');
  const statusLabel = {
    IN_PROGRESS: 'In Progress',
    ON_HOLD: 'On Hold',
    RESOLVED: 'Complete',
  }[status];
  const staffName = [user.firstName || user.first_name, user.lastName || user.last_name].filter(Boolean).join(' ') || 'Assigned staff';
  await notifySocietyAdmins({
    societyId: updated.society_id,
    title: 'Assigned ticket updated',
    message: `${staffName} changed ticket ${updated.ticket_no}${updated.subject ? ` (${updated.subject})` : ''} to ${statusLabel}.`,
    referenceType: 'TICKET',
    referenceId: updated.id,
    data: { ticketId: updated.id, ticketNo: updated.ticket_no, subject: updated.subject, status },
    excludeUserId: user.id,
  });
  await notifyResidentUser({
    societyId: updated.society_id,
    userId: updated.raised_by,
    title: 'Your request status changed',
    message: `Your request ${updated.ticket_no}${updated.subject ? ` (${updated.subject})` : ''} is now ${statusLabel}.`,
    referenceType: 'TICKET',
    referenceId: updated.id,
    data: { ticketId: updated.id, ticketNo: updated.ticket_no, subject: updated.subject, status },
  });
  return updated;
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

  publishTicketStatusChanged(updated);

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

const assignTicket = async (ticketId, { assignedToUserId, assignedToStaffId, assignedVendorId }, vendorScope, assignedByUserId) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  await assertVendorCanAccess(ticketId, vendorScope);
  if (!assignedToUserId && !assignedToStaffId && !assignedVendorId) {
    throw new ApiError(400, 'Select a staff member or vendor to assign this ticket');
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

  const assignedStaff = assignedToStaffId
    ? await repository.findAssignableStaff(assignedToStaffId, ticket.society_id)
    : null;
  if (assignedToStaffId && !assignedStaff) {
    throw new ApiError(400, 'Select an active staff member from this society');
  }

  if (current) {
    await repository.unassign(current.id);
  }

  // Keep a user link alongside the staff profile when that staff member has a
  // login. Staff home screens can then find the assignment by either identity.
  const staffUserId = assignedToStaffId
    ? await repository.findStaffUserId(assignedToStaffId)
    : null;
  const assignment = await repository.createAssignment({
    ticketId,
    assignedToUserId: assignedToUserId || staffUserId,
    assignedToStaffId,
    assignedVendorId: finalVendorId,
  });

  if (assignedToStaffId) {
    securityEvents.publishTicketAssigned(staffUserId);
  } else if (assignedToUserId) {
    securityEvents.publishTicketAssigned(assignedToUserId);
  }

  if (ticket.status === 'OPEN') {
    await updateStatus(ticketId, 'ASSIGNED', assignedByUserId || null, 'Auto-transitioned on assignment', vendorScope);
  }

  if (assignedStaff) {
    const staffName = [assignedStaff.first_name, assignedStaff.last_name].filter(Boolean).join(' ') || 'A staff member';
    await notifyResidentUser({
      societyId: ticket.society_id,
      userId: ticket.raised_by,
      title: 'Staff assigned to your request',
      message: `${staffName} has been assigned to your request ${ticket.ticket_no}${ticket.subject ? ` (${ticket.subject})` : ''}.`,
      referenceType: 'TICKET',
      referenceId: ticket.id,
      data: { ticketId: ticket.id, ticketNo: ticket.ticket_no, subject: ticket.subject, staffName },
    });
  }

  return assignment;
};

const unassignTicket = async (ticketId, changedBy, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  await assertVendorCanAccess(ticketId, vendorScope);
  const current = await repository.findActiveAssignment(ticketId);
  if (!current) {
    throw new ApiError(400, 'This ticket has no active assignment');
  }
  const unassigned = await repository.unassign(current.id);
  if (ticket.status === 'ASSIGNED') {
    const reopened = await repository.updateStatus(ticketId, 'OPEN');
    await repository.addStatusHistory({
      ticketId,
      oldStatus: 'ASSIGNED',
      newStatus: 'OPEN',
      changedBy,
      remarks: 'Automatically reopened after unassignment',
    });
    publishTicketStatusChanged(reopened);
  }
  return unassigned;
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

const deleteAttachment = async (ticketId, attachmentId, vendorScope) => {
  const ticket = await repository.findById(ticketId);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  await assertVendorCanAccess(ticketId, vendorScope);
  const deleted = await repository.deleteAttachment(ticketId, attachmentId);
  if (!deleted) throw new ApiError(404, 'Attachment not found');
  return deleted;
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
  listAssignedStaffTickets,
  updateAssignedStaffTicketStatus,
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
  deleteAttachment,
  listStatusHistory,
  addRating,
};
