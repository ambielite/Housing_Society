const ApiError = require('../../common/ApiError');
const repository = require('./procurement.repository');
const vendorsRepository = require('../vendors/vendors.repository');
const db = require('../../config/db');
const { isVendorScoped } = require('../../common/vendorScope');

const isVendorOnly = isVendorScoped;
const requireVendorId = (user) => {
  if (!user?.vendorId) throw new ApiError(403, 'Your user is not linked to a vendor');
  return user.vendorId;
};

// --- purchase requests -------------------------------------------------------

const createRequest = async ({ societyId, requestedBy, requestNo, requestedDate, department, justification, estimatedAmount }) => {
  const existing = await repository.findRequestByNo(societyId, requestNo);
  if (existing) {
    throw new ApiError(409, 'A purchase request with this request number already exists in this society');
  }
  return repository.createRequest({ societyId, requestedBy, requestNo, requestedDate, department, justification, estimatedAmount });
};

const listRequests = (query) => repository.listRequests(query);

const getRequest = async (id) => {
  const request = await repository.findRequestById(id);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  const lines = await repository.listRequestLines(id);
  return { ...request, lines };
};

/**
 * DRAFT -> SUBMITTED -> QUOTATION -> APPROVAL -> APPROVED/REJECTED -> PO_ISSUED -> CANCELLED
 * Only forward transitions along that path (or -> CANCELLED from
 * anywhere before PO_ISSUED) are allowed; this keeps the status field
 * honest instead of letting any caller jump it to any value.
 */
const ALLOWED_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['QUOTATION', 'CANCELLED'],
  QUOTATION: ['APPROVAL', 'CANCELLED'],
  APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PO_ISSUED', 'CANCELLED'],
  REJECTED: [],
  PO_ISSUED: [],
  CANCELLED: [],
};

const updateRequestStatus = async (id, status) => {
  const request = await repository.findRequestById(id);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  const allowed = ALLOWED_TRANSITIONS[request.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot move a ${request.status} purchase request to ${status}`);
  }
  return repository.updateRequestStatus(id, status);
};

const deleteRequest = async (id) => {
  const request = await repository.findRequestById(id);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  const deleted = await repository.deleteRequest(id);
  if (!deleted) {
    throw new ApiError(400, 'Purchase request could not be deleted (it may have related RFQs/POs)');
  }
  return deleted;
};

const addRequestLine = async (purchaseRequestId, payload) => {
  const request = await repository.findRequestById(purchaseRequestId);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  if (payload.assetCategoryId) {
    const category = await db.query('SELECT id, society_id, status FROM asset_categories WHERE id = $1', [payload.assetCategoryId]);
    if (!category.rows[0] || category.rows[0].society_id !== request.society_id || category.rows[0].status !== 'ACTIVE') {
      throw new ApiError(400, 'Choose an active asset category from the purchase request society');
    }
  }
  return repository.addRequestLine({ purchaseRequestId, ...payload });
};

const listRequestLines = async (purchaseRequestId) => {
  const request = await repository.findRequestById(purchaseRequestId);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  return repository.listRequestLines(purchaseRequestId);
};

// --- RFQs --------------------------------------------------------------------

const createRfq = async ({ purchaseRequestId, rfqNo, issueDate, dueDate }) => {
  const request = await repository.findRequestById(purchaseRequestId);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  return repository.createRfq({ purchaseRequestId, rfqNo, issueDate, dueDate });
};

const listRfqs = async (purchaseRequestId, actingUser) => {
  const request = await repository.findRequestById(purchaseRequestId);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  return isVendorOnly(actingUser)
    ? repository.listRfqsForVendor(purchaseRequestId, requireVendorId(actingUser))
    : repository.listRfqs(purchaseRequestId);
};

const getRfq = async (id, actingUser) => {
  const rfq = await repository.findRfqById(id);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  const vendors = await repository.listInvitedVendors(id);
  if (isVendorOnly(actingUser)) {
    const vendorId = requireVendorId(actingUser);
    if (!(await repository.findInvite(id, vendorId))) throw new ApiError(404, 'RFQ not found');
    return { ...rfq, invitedVendors: vendors.filter((v) => v.vendor_id === vendorId) };
  }
  return { ...rfq, invitedVendors: vendors };
};

const closeRfq = async (id) => {
  const rfq = await repository.findRfqById(id);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  if (rfq.status === 'CLOSED') {
    throw new ApiError(400, 'This RFQ is already closed');
  }
  return repository.updateRfqStatus(id, 'CLOSED');
};

const inviteVendor = async (rfqId, vendorId) => {
  const rfq = await repository.findRfqById(rfqId);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  const vendor = await vendorsRepository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  if (vendor.status !== 'ACTIVE') {
    throw new ApiError(400, 'Only ACTIVE vendors can be invited to an RFQ');
  }
  return repository.inviteVendor(rfqId, vendorId);
};

const listInvitedVendors = async (rfqId, actingUser) => {
  const rfq = await repository.findRfqById(rfqId);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  const invites = await repository.listInvitedVendors(rfqId);
  if (isVendorOnly(actingUser)) {
    const vendorId = requireVendorId(actingUser);
    return invites.filter((invite) => invite.vendor_id === vendorId);
  }
  return invites;
};

// --- quotations ----------------------------------------------------------------

const submitQuotation = async ({ rfqId, vendorId, quotationNo, quotationDate, validUntil }, actingUser) => {
  if (isVendorOnly(actingUser)) {
    const ownVendorId = requireVendorId(actingUser);
    if (vendorId && vendorId !== ownVendorId) throw new ApiError(403, 'You can only submit quotations for your own vendor');
    vendorId = ownVendorId;
  }
  const rfq = await repository.findRfqById(rfqId);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  if (rfq.status === 'CLOSED') {
    throw new ApiError(400, 'This RFQ is closed and no longer accepting quotations');
  }
  const invite = await repository.findInvite(rfqId, vendorId);
  if (!invite) {
    throw new ApiError(403, 'This vendor was not invited to this RFQ');
  }

  const quotation = await repository.createQuotation({ rfqId, vendorId, quotationNo, quotationDate, validUntil });
  await repository.updateInviteResponseStatus(rfqId, vendorId, 'RESPONDED');
  return quotation;
};

const listQuotations = async (rfqId, actingUser) => {
  const rfq = await repository.findRfqById(rfqId);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  const quotations = await repository.listQuotations(rfqId);
  if (isVendorOnly(actingUser)) return quotations.filter((q) => q.vendor_id === requireVendorId(actingUser));
  return quotations;
};

const getQuotation = async (id, actingUser) => {
  const quotation = await repository.findQuotationById(id);
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }
  if (isVendorOnly(actingUser) && quotation.vendor_id !== requireVendorId(actingUser)) throw new ApiError(404, 'Quotation not found');
  const lines = await repository.listQuotationLines(id);
  return { ...quotation, lines };
};

const addQuotationLine = async (quotationId, payload, actingUser) => {
  const quotation = await repository.findQuotationById(quotationId);
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }
  if (isVendorOnly(actingUser) && quotation.vendor_id !== requireVendorId(actingUser)) throw new ApiError(404, 'Quotation not found');
  await repository.addQuotationLine({ quotationId, ...payload });
  return repository.recalculateQuotationTotals(quotationId);
};

const decideQuotation = async (id, status) => {
  const quotation = await repository.findQuotationById(id);
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }
  if (quotation.status !== 'SUBMITTED') {
    throw new ApiError(400, `This quotation is already ${quotation.status}`);
  }
  return repository.updateQuotationStatus(id, status);
};

// --- comparisons --------------------------------------------------------------

const addComparison = async (rfqId, payload) => {
  const rfq = await repository.findRfqById(rfqId);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  return repository.addComparison({ rfqId, ...payload });
};

const listComparisons = async (rfqId) => {
  const rfq = await repository.findRfqById(rfqId);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }
  return repository.listComparisons(rfqId);
};

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  updateRequestStatus,
  deleteRequest,
  addRequestLine,
  listRequestLines,
  createRfq,
  listRfqs,
  getRfq,
  closeRfq,
  inviteVendor,
  listInvitedVendors,
  submitQuotation,
  listQuotations,
  getQuotation,
  addQuotationLine,
  decideQuotation,
  addComparison,
  listComparisons,
};
