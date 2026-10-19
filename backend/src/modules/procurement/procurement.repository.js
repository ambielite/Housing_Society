const db = require('../../config/db');

// --- purchase_requests -----------------------------------------------------

const createRequest = async ({ societyId, requestedBy, requestNo, requestedDate, department, justification, estimatedAmount }) => {
  const result = await db.query(
    `INSERT INTO purchase_requests
       (society_id, requested_by, request_no, requested_date, department, justification, estimated_amount)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7)
     RETURNING *`,
    [societyId, requestedBy, requestNo, requestedDate || null, department || null, justification || null, estimatedAmount || null]
  );
  return result.rows[0];
};

const findRequestByNo = async (societyId, requestNo) => {
  const result = await db.query(
    'SELECT * FROM purchase_requests WHERE society_id = $1 AND request_no = $2',
    [societyId, requestNo]
  );
  return result.rows[0] || null;
};

const findRequestById = async (id) => {
  const result = await db.query('SELECT * FROM purchase_requests WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listRequests = async ({ societyId, status, requestedBy }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (requestedBy) {
    conditions.push(`requested_by = $${idx++}`);
    params.push(requestedBy);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM purchase_requests ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateRequestStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE purchase_requests SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

const deleteRequest = async (id) => {
  const result = await db.query('DELETE FROM purchase_requests WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- purchase_request_lines --------------------------------------------------

const addRequestLine = async ({ purchaseRequestId, itemDescription, quantity, estimatedUnitCost, assetCategoryId }) => {
  const result = await db.query(
    `INSERT INTO purchase_request_lines (purchase_request_id, item_description, quantity, estimated_unit_cost, asset_category_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [purchaseRequestId, itemDescription, quantity, estimatedUnitCost || null, assetCategoryId || null]
  );
  return result.rows[0];
};

const listRequestLines = async (purchaseRequestId) => {
  const result = await db.query(
    `SELECT prl.*, ac.category_name AS asset_category_name
     FROM purchase_request_lines prl
     LEFT JOIN asset_categories ac ON ac.id = prl.asset_category_id
     WHERE prl.purchase_request_id = $1`,
    [purchaseRequestId]
  );
  return result.rows;
};

// --- rfqs ----------------------------------------------------------------------

const createRfq = async ({ purchaseRequestId, rfqNo, issueDate, dueDate }) => {
  const result = await db.query(
    `INSERT INTO rfqs (purchase_request_id, rfq_no, issue_date, due_date)
     VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4)
     RETURNING *`,
    [purchaseRequestId, rfqNo, issueDate || null, dueDate || null]
  );
  return result.rows[0];
};

const findRfqById = async (id) => {
  const result = await db.query('SELECT * FROM rfqs WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listRfqs = async (purchaseRequestId) => {
  const result = await db.query(
    'SELECT * FROM rfqs WHERE purchase_request_id = $1 ORDER BY created_at DESC',
    [purchaseRequestId]
  );
  return result.rows;
};

const listRfqsForVendor = async (purchaseRequestId, vendorId) => {
  const result = await db.query(
    `SELECT DISTINCT r.* FROM rfqs r
     JOIN rfq_vendors rv ON rv.rfq_id = r.id
     WHERE r.purchase_request_id = $1 AND rv.vendor_id = $2
     ORDER BY r.created_at DESC`,
    [purchaseRequestId, vendorId]
  );
  return result.rows;
};

const updateRfqStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE rfqs SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

// --- rfq_vendors -----------------------------------------------------------------

const inviteVendor = async (rfqId, vendorId) => {
  const result = await db.query(
    `INSERT INTO rfq_vendors (rfq_id, vendor_id)
     VALUES ($1, $2)
     ON CONFLICT (rfq_id, vendor_id) DO NOTHING
     RETURNING *`,
    [rfqId, vendorId]
  );
  return result.rows[0] || null;
};

const listInvitedVendors = async (rfqId) => {
  const result = await db.query('SELECT * FROM rfq_vendors WHERE rfq_id = $1', [rfqId]);
  return result.rows;
};

const findInvite = async (rfqId, vendorId) => {
  const result = await db.query(
    'SELECT * FROM rfq_vendors WHERE rfq_id = $1 AND vendor_id = $2',
    [rfqId, vendorId]
  );
  return result.rows[0] || null;
};

const updateInviteResponseStatus = async (rfqId, vendorId, responseStatus) => {
  const result = await db.query(
    'UPDATE rfq_vendors SET response_status = $3 WHERE rfq_id = $1 AND vendor_id = $2 RETURNING *',
    [rfqId, vendorId, responseStatus]
  );
  return result.rows[0] || null;
};

// --- quotations --------------------------------------------------------------------

const createQuotation = async ({ rfqId, vendorId, quotationNo, quotationDate, validUntil }) => {
  const result = await db.query(
    `INSERT INTO quotations (rfq_id, vendor_id, quotation_no, quotation_date, valid_until)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
     RETURNING *`,
    [rfqId, vendorId, quotationNo, quotationDate || null, validUntil || null]
  );
  return result.rows[0];
};

const findQuotationById = async (id) => {
  const result = await db.query('SELECT * FROM quotations WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listQuotations = async (rfqId) => {
  const result = await db.query('SELECT * FROM quotations WHERE rfq_id = $1 ORDER BY created_at DESC', [rfqId]);
  return result.rows;
};

const updateQuotationStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE quotations SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

const recalculateQuotationTotals = async (quotationId) => {
  const result = await db.query(
    `UPDATE quotations SET
       subtotal = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM quotation_lines WHERE quotation_id = $1),
       tax      = (SELECT COALESCE(SUM(tax), 0) FROM quotation_lines WHERE quotation_id = $1),
       total    = (SELECT COALESCE(SUM(total), 0) FROM quotation_lines WHERE quotation_id = $1),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [quotationId]
  );
  return result.rows[0] || null;
};

// --- quotation_lines -----------------------------------------------------------------

const addQuotationLine = async ({ quotationId, description, quantity, unitPrice, tax }) => {
  const lineTax = tax || 0;
  const total = quantity * unitPrice + lineTax;
  const result = await db.query(
    `INSERT INTO quotation_lines (quotation_id, description, quantity, unit_price, tax, total)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [quotationId, description, quantity, unitPrice, lineTax, total]
  );
  return result.rows[0];
};

const listQuotationLines = async (quotationId) => {
  const result = await db.query('SELECT * FROM quotation_lines WHERE quotation_id = $1', [quotationId]);
  return result.rows;
};

// --- quotation_comparisons -------------------------------------------------------------

const addComparison = async ({ rfqId, criterion, vendorId, score, remarks }) => {
  const result = await db.query(
    `INSERT INTO quotation_comparisons (rfq_id, criterion, vendor_id, score, remarks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [rfqId, criterion, vendorId, score || null, remarks || null]
  );
  return result.rows[0];
};

const listComparisons = async (rfqId) => {
  const result = await db.query(
    'SELECT * FROM quotation_comparisons WHERE rfq_id = $1 ORDER BY created_at DESC',
    [rfqId]
  );
  return result.rows;
};

module.exports = {
  createRequest,
  findRequestByNo,
  findRequestById,
  listRequests,
  updateRequestStatus,
  deleteRequest,
  addRequestLine,
  listRequestLines,
  createRfq,
  findRfqById,
  listRfqs,
  listRfqsForVendor,
  updateRfqStatus,
  inviteVendor,
  listInvitedVendors,
  findInvite,
  updateInviteResponseStatus,
  createQuotation,
  findQuotationById,
  listQuotations,
  updateQuotationStatus,
  recalculateQuotationTotals,
  addQuotationLine,
  listQuotationLines,
  addComparison,
  listComparisons,
};
