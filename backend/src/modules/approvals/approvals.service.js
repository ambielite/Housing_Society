const ApiError = require('../../common/ApiError');
const repository = require('./approvals.repository');
const procurementRepository = require('../procurement/procurement.repository');
const purchaseOrdersRepository = require('../purchase-orders/purchase-orders.repository');
const db = require('../../config/db');

/**
 * Generic approval engine (per the DB doc, approval_requests /
 * approval_actions are explicitly reusable across entity types, not
 * hardcoded to procurement). Other modules (purchase-requests,
 * purchase-orders, vendor-invoices) call raiseApproval() when something
 * needs sign-off, and read back the resulting status.
 *
 * Simplification: the DB doc doesn't include a separate "approval
 * matrix" config table (thresholds, number of required levels, etc.),
 * so this implementation supports simple sequential levels driven by
 * whoever calls decide() - each APPROVE bumps current_level by one and
 * the request stays PENDING until the caller explicitly marks it fully
 * approved (isFinalLevel: true) or rejects/cancels it. True
 * threshold-based/parallel approval matrices are configuration this
 * phase doesn't have a table for yet - flagged as a known gap, not a
 * bug, per the roadmap's Approval Matrix requirements list.
 */

const raiseApproval = async ({ societyId, entityType, entityId, approvalType }) => {
  let entity;
  if (entityType === 'PURCHASE_REQUEST') entity = await procurementRepository.findRequestById(entityId);
  else if (entityType === 'PURCHASE_ORDER') entity = await purchaseOrdersRepository.findPOById(entityId);
  else if (entityType === 'VENDOR_INVOICE') {
    const result = await db.query(
      `SELECT vi.id, v.society_id FROM vendor_invoices vi
       JOIN vendors v ON v.id = vi.vendor_id WHERE vi.id = $1`,
      [entityId]
    );
    entity = result.rows[0] || null;
  }
  if (!entity) throw new ApiError(404, 'The selected approval record was not found');
  if (entity.society_id !== societyId) throw new ApiError(400, 'The selected approval record belongs to a different society');

  const existingOpen = await repository.findOpenForEntity(entityType, entityId);
  if (existingOpen) {
    throw new ApiError(409, 'An approval request is already pending for this entity');
  }
  return repository.createRequest({ societyId, entityType, entityId, approvalType });
};

const listRequests = (query) => repository.listRequests(query);

const getRequest = async (id) => {
  const request = await repository.findById(id);
  if (!request) {
    throw new ApiError(404, 'Approval request not found');
  }
  const actions = await repository.listActions(id);
  return { ...request, actions };
};

const getRequestForEntity = async (entityType, entityId) => {
  const request = await repository.findOpenForEntity(entityType, entityId);
  return request;
};

/**
 * decide() records one approver's action.
 * - decision: APPROVE | REJECT | INFO_REQUESTED
 * - isFinalLevel: pass true when this APPROVE should close out the
 *   request as fully APPROVED (i.e. this was the last required level).
 *   Callers that don't have a multi-level matrix should always pass true.
 */
const decide = async ({ approvalRequestId, approverId, decision, remarks, isFinalLevel }) => {
  const request = await repository.findById(approvalRequestId);
  if (!request) {
    throw new ApiError(404, 'Approval request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(400, `This approval request is already ${request.status}`);
  }

  const level = request.current_level;
  await repository.addAction({ approvalRequestId, approverId, level, decision, remarks });

  if (decision === 'REJECT') {
    return repository.updateStatus(approvalRequestId, 'REJECTED');
  }
  if (decision === 'INFO_REQUESTED') {
    return repository.updateStatus(approvalRequestId, 'INFO_REQUIRED');
  }
  // APPROVE
  if (isFinalLevel) {
    return repository.updateStatus(approvalRequestId, 'APPROVED');
  }
  return repository.updateStatus(approvalRequestId, 'PENDING', level + 1);
};

const cancel = async (id) => {
  const request = await repository.findById(id);
  if (!request) {
    throw new ApiError(404, 'Approval request not found');
  }
  if (request.status !== 'PENDING' && request.status !== 'INFO_REQUIRED') {
    throw new ApiError(400, `Cannot cancel an approval request that is already ${request.status}`);
  }
  return repository.updateStatus(id, 'CANCELLED');
};

module.exports = {
  raiseApproval,
  listRequests,
  getRequest,
  getRequestForEntity,
  decide,
  cancel,
};
