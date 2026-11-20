const ApiError = require('../../common/ApiError');
const { query } = require('../../config/db');
const helpdeskRepository = require('../helpdesk-setup/helpdesk-setup.repository');
const ticketsRepository = require('../tickets/tickets.repository');
const ticketsService = require('../tickets/tickets.service');
const { resolveResident, resolveSingleUnit } = require('../resident-context/residentUnitContext.service');
const { subscribeToTicketStatusChanges } = require('../tickets/tickets.events');

const requireResidentContext = async (user) => {
  if (!user.societyId) throw new ApiError(403, 'Your account is not linked to a society');
  const resident = await resolveResident(user, { allowEmailFallback: false });
  if (!resident) throw new ApiError(403, 'Your resident profile is not linked to this account');
  return resident;
};

const listCategories = async (user) => {
  await requireResidentContext(user);
  const categories = await helpdeskRepository.listCategories({
    societyId: user.societyId,
    status: 'ACTIVE',
  });
  return categories;
};

const listComplaints = async (user) => {
  await requireResidentContext(user);
  const result = await query(
    `SELECT t.id, t.ticket_no, t.category_id, c.name AS category_name,
            t.subject, t.description, t.priority, t.status, t.opened_at,
            t.resolved_at, t.closed_at
       FROM tickets t
       LEFT JOIN ticket_categories c ON c.id = t.category_id
      WHERE t.society_id = $1 AND t.raised_by = $2
      ORDER BY t.opened_at DESC`,
    [user.societyId, user.id],
  );
  return result.rows;
};

const streamStatusUpdates = async (user, res) => {
  await requireResidentContext(user);
  res.status(200);
  res.set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate, private', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write(': complaint status stream connected\n\n');
  const unsubscribe = subscribeToTicketStatusChanges((event) => {
    if (event.residentUserId !== user.id || event.societyId !== user.societyId) return;
    res.write(`event: complaint_status\ndata: ${JSON.stringify({ ticketId: event.ticketId, status: event.status })}\n\n`);
  });
  const heartbeat = setInterval(() => { if (!res.destroyed) res.write(': keepalive\n\n'); }, 25000);
  res.on('close', () => { clearInterval(heartbeat); unsubscribe(); });
};

const createComplaint = async (user, payload) => {
  if (!user.societyId) throw new ApiError(403, 'Your account is not linked to a society');
  const { resident, unit } = await resolveSingleUnit(user, { allowEmailFallback: false });
  const category = await helpdeskRepository.findCategoryById(payload.categoryId);
  if (!category || category.society_id !== user.societyId || category.status !== 'ACTIVE') {
    throw new ApiError(400, 'Choose an active complaint category for your society');
  }
  const subject = String(payload.subject || '').trim();
  const description = String(payload.description || '').trim();
  if (!subject || subject.length > 255) {
    throw new ApiError(400, 'Enter a subject of 1 to 255 characters');
  }
  if (!description || description.length > 5000) {
    throw new ApiError(400, 'Describe the complaint in 1 to 5000 characters');
  }

  return ticketsService.createTicket({
    societyId: user.societyId,
    categoryId: category.id,
    raisedBy: user.id,
    unitId: unit.unit_id,
    subject,
    description,
  });
};

const getComplaint = async (user, ticketId) => {
  await requireResidentContext(user);
  const ticket = await ticketsRepository.findById(ticketId);
  if (!ticket || ticket.society_id !== user.societyId || ticket.raised_by !== user.id) {
    throw new ApiError(404, 'Complaint not found');
  }
  return ticket;
};

module.exports = { listCategories, listComplaints, streamStatusUpdates, createComplaint, getComplaint };
