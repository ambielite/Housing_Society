const service = require('./tickets.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');
const { isVendorScoped } = require('../../common/vendorScope');

/** Vendor-role callers are scoped unless they also hold an explicit staff role. */
const vendorScopeFor = (req) => {
  return isVendorScoped(req.user)
    ? { restricted: true, vendorId: req.user.vendorId || null, userId: req.user.id }
    : null;
};

// --- tickets ---
const createTicket = asyncHandler(async (req, res) => {
  const ticket = await service.createTicket(req.body);
  return ApiResponse.success(res, ticket, 'Ticket created successfully', 201);
});

const listTickets = asyncHandler(async (req, res) => {
  const tickets = await service.listTickets(req.query, vendorScopeFor(req));
  return ApiResponse.success(res, tickets);
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await service.getTicket(req.params.ticketId, vendorScopeFor(req));
  return ApiResponse.success(res, ticket);
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await service.updateTicket(req.params.ticketId, req.body, vendorScopeFor(req));
  return ApiResponse.success(res, ticket, 'Ticket updated successfully');
});

const updateStatus = asyncHandler(async (req, res) => {
  const ticket = await service.updateStatus(req.params.ticketId, req.body.status, req.user.id, req.body.remarks, vendorScopeFor(req));
  return ApiResponse.success(res, ticket, 'Ticket status updated successfully');
});

const deleteTicket = asyncHandler(async (req, res) => {
  await service.deleteTicket(req.params.ticketId, vendorScopeFor(req));
  return ApiResponse.success(res, null, 'Ticket deleted successfully');
});

// --- assignments ---
const assignTicket = asyncHandler(async (req, res) => {
  const assignment = await service.assignTicket(req.params.ticketId, req.body, vendorScopeFor(req));
  return ApiResponse.success(res, assignment, 'Ticket assigned successfully', 201);
});

const unassignTicket = asyncHandler(async (req, res) => {
  const assignment = await service.unassignTicket(req.params.ticketId, vendorScopeFor(req));
  return ApiResponse.success(res, assignment, 'Ticket unassigned successfully');
});

const listAssignments = asyncHandler(async (req, res) => {
  const assignments = await service.listAssignments(req.params.ticketId, vendorScopeFor(req));
  return ApiResponse.success(res, assignments);
});

// --- comments ---
const addComment = asyncHandler(async (req, res) => {
  const comment = await service.addComment(req.params.ticketId, { authorId: req.user.id, ...req.body }, vendorScopeFor(req));
  return ApiResponse.success(res, comment, 'Comment added successfully', 201);
});

const listComments = asyncHandler(async (req, res) => {
  const scope = vendorScopeFor(req);
  const includeInternal = !scope;
  const comments = await service.listComments(req.params.ticketId, includeInternal, scope);
  return ApiResponse.success(res, comments);
});

// --- attachments ---
const addAttachment = asyncHandler(async (req, res) => {
  const attachment = await service.addAttachment(req.params.ticketId, req.body.documentId, vendorScopeFor(req));
  return ApiResponse.success(res, attachment, 'Attachment added successfully', 201);
});

const listAttachments = asyncHandler(async (req, res) => {
  const attachments = await service.listAttachments(req.params.ticketId, vendorScopeFor(req));
  return ApiResponse.success(res, attachments);
});

// --- status history ---
const listStatusHistory = asyncHandler(async (req, res) => {
  const history = await service.listStatusHistory(req.params.ticketId, vendorScopeFor(req));
  return ApiResponse.success(res, history);
});

// --- ratings ---
const addRating = asyncHandler(async (req, res) => {
  const rating = await service.addRating(req.params.ticketId, { ratedBy: req.user.id, ...req.body }, vendorScopeFor(req));
  return ApiResponse.success(res, rating, 'Rating recorded successfully', 201);
});

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
