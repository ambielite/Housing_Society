const db = require('../../config/db');

// --- purchase_orders --------------------------------------------------------

const createPO = async ({ societyId, vendorId, purchaseRequestId, poNo, poDate, deliveryDate }) => {
  const result = await db.query(
    `INSERT INTO purchase_orders (society_id, vendor_id, purchase_request_id, po_no, po_date, delivery_date)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6)
     RETURNING *`,
    [societyId, vendorId, purchaseRequestId || null, poNo, poDate || null, deliveryDate || null]
  );
  return result.rows[0];
};

const findPOById = async (id) => {
  const result = await db.query(
    `SELECT po.*, pr.request_no AS purchase_request_no
     FROM purchase_orders po
     LEFT JOIN purchase_requests pr ON pr.id = po.purchase_request_id
     WHERE po.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const findPOByNo = async (poNo) => {
  const result = await db.query('SELECT * FROM purchase_orders WHERE po_no = $1', [poNo]);
  return result.rows[0] || null;
};

const listPOs = async ({ societyId, vendorId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (vendorId) {
    conditions.push(`vendor_id = $${idx++}`);
    params.push(vendorId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM purchase_orders ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updatePOStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE purchase_orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

const recalculatePOTotals = async (poId) => {
  const result = await db.query(
    `UPDATE purchase_orders SET
       subtotal = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM purchase_order_lines WHERE purchase_order_id = $1),
       tax      = (SELECT COALESCE(SUM(tax), 0) FROM purchase_order_lines WHERE purchase_order_id = $1),
       total    = (SELECT COALESCE(SUM(total), 0) FROM purchase_order_lines WHERE purchase_order_id = $1),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [poId]
  );
  return result.rows[0] || null;
};

// --- purchase_order_lines -----------------------------------------------------

const addPOLine = async ({ purchaseOrderId, itemDescription, quantity, unitPrice, tax, assetCategoryId }) => {
  const lineTax = tax || 0;
  const total = quantity * unitPrice + lineTax;
  const result = await db.query(
    `INSERT INTO purchase_order_lines (purchase_order_id, item_description, quantity, unit_price, tax, total, asset_category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [purchaseOrderId, itemDescription, quantity, unitPrice, lineTax, total, assetCategoryId || null]
  );
  return result.rows[0];
};

const listPOLines = async (purchaseOrderId) => {
  const result = await db.query(
    `SELECT pol.*, ac.category_name AS asset_category_name
     FROM purchase_order_lines pol
     LEFT JOIN asset_categories ac ON ac.id = pol.asset_category_id
     WHERE pol.purchase_order_id = $1`,
    [purchaseOrderId]
  );
  return result.rows;
};

const findPOLineById = async (id) => {
  const result = await db.query('SELECT * FROM purchase_order_lines WHERE id = $1', [id]);
  return result.rows[0] || null;
};

// --- goods_receipts ------------------------------------------------------------

const createGoodsReceipt = async ({ purchaseOrderId, receiptNo, receivedBy, status }) => {
  const result = await db.query(
    `INSERT INTO goods_receipts (purchase_order_id, receipt_no, received_by, status)
     VALUES ($1, $2, $3, COALESCE($4, 'ACCEPTED'))
     RETURNING *`,
    [purchaseOrderId, receiptNo, receivedBy || null, status || null]
  );
  return result.rows[0];
};

const findGoodsReceiptById = async (id) => {
  const result = await db.query('SELECT * FROM goods_receipts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listGoodsReceipts = async (purchaseOrderId) => {
  const result = await db.query(
    'SELECT * FROM goods_receipts WHERE purchase_order_id = $1 ORDER BY received_at DESC',
    [purchaseOrderId]
  );
  return result.rows;
};

const addGoodsReceiptLine = async ({ goodsReceiptId, poLineId, receivedQty, acceptedQty, rejectedQty }) => {
  const result = await db.query(
    `INSERT INTO goods_receipt_lines (goods_receipt_id, po_line_id, received_qty, accepted_qty, rejected_qty)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [goodsReceiptId, poLineId, receivedQty, acceptedQty || 0, rejectedQty || 0]
  );
  return result.rows[0];
};

const listGoodsReceiptLines = async (goodsReceiptId) => {
  const result = await db.query('SELECT * FROM goods_receipt_lines WHERE goods_receipt_id = $1', [goodsReceiptId]);
  return result.rows;
};

// --- vendor_invoices -----------------------------------------------------------

const createInvoice = async ({ vendorId, purchaseOrderId, invoiceNo, invoiceDate, dueDate, documentId }) => {
  const result = await db.query(
    `INSERT INTO vendor_invoices (vendor_id, purchase_order_id, invoice_no, invoice_date, due_date, document_id)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6)
     RETURNING *`,
    [vendorId, purchaseOrderId || null, invoiceNo, invoiceDate || null, dueDate || null, documentId || null]
  );
  return result.rows[0];
};

const findInvoiceById = async (id) => {
  const result = await db.query('SELECT * FROM vendor_invoices WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const findInvoiceByNo = async (vendorId, invoiceNo) => {
  const result = await db.query(
    'SELECT * FROM vendor_invoices WHERE vendor_id = $1 AND invoice_no = $2',
    [vendorId, invoiceNo]
  );
  return result.rows[0] || null;
};

const listInvoices = async ({ vendorId, purchaseOrderId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (vendorId) {
    conditions.push(`vendor_id = $${idx++}`);
    params.push(vendorId);
  }
  if (purchaseOrderId) {
    conditions.push(`purchase_order_id = $${idx++}`);
    params.push(purchaseOrderId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM vendor_invoices ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateInvoiceStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE vendor_invoices SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

const recalculateInvoiceTotals = async (invoiceId) => {
  const result = await db.query(
    `UPDATE vendor_invoices SET
       subtotal = (SELECT COALESCE(SUM(quantity * amount), 0) FROM vendor_invoice_lines WHERE vendor_invoice_id = $1),
       tax      = (SELECT COALESCE(SUM(tax), 0) FROM vendor_invoice_lines WHERE vendor_invoice_id = $1),
       total    = (SELECT COALESCE(SUM(quantity * amount + tax), 0) FROM vendor_invoice_lines WHERE vendor_invoice_id = $1),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [invoiceId]
  );
  return result.rows[0] || null;
};

// --- vendor_invoice_lines --------------------------------------------------------

const addInvoiceLine = async ({ vendorInvoiceId, poLineId, description, quantity, amount, tax }) => {
  const result = await db.query(
    `INSERT INTO vendor_invoice_lines (vendor_invoice_id, po_line_id, description, quantity, amount, tax)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [vendorInvoiceId, poLineId || null, description, quantity || 1, amount, tax || 0]
  );
  return result.rows[0];
};

const listInvoiceLines = async (vendorInvoiceId) => {
  const result = await db.query('SELECT * FROM vendor_invoice_lines WHERE vendor_invoice_id = $1', [vendorInvoiceId]);
  return result.rows;
};

// --- vendor_payments ------------------------------------------------------------

const allocatePayment = async ({ vendorInvoiceId, paymentId, allocatedAmount }) => {
  const result = await db.query(
    `INSERT INTO vendor_payments (vendor_invoice_id, payment_id, allocated_amount)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [vendorInvoiceId, paymentId || null, allocatedAmount]
  );
  return result.rows[0];
};

const listPaymentsForInvoice = async (vendorInvoiceId) => {
  const result = await db.query(
    'SELECT * FROM vendor_payments WHERE vendor_invoice_id = $1 ORDER BY created_at DESC',
    [vendorInvoiceId]
  );
  return result.rows;
};

const sumAllocatedForInvoice = async (vendorInvoiceId) => {
  const result = await db.query(
    'SELECT COALESCE(SUM(allocated_amount), 0)::numeric AS total FROM vendor_payments WHERE vendor_invoice_id = $1',
    [vendorInvoiceId]
  );
  return parseFloat(result.rows[0].total);
};

module.exports = {
  createPO,
  findPOById,
  findPOByNo,
  listPOs,
  updatePOStatus,
  recalculatePOTotals,
  addPOLine,
  listPOLines,
  findPOLineById,
  createGoodsReceipt,
  findGoodsReceiptById,
  listGoodsReceipts,
  addGoodsReceiptLine,
  listGoodsReceiptLines,
  createInvoice,
  findInvoiceById,
  findInvoiceByNo,
  listInvoices,
  updateInvoiceStatus,
  recalculateInvoiceTotals,
  addInvoiceLine,
  listInvoiceLines,
  allocatePayment,
  listPaymentsForInvoice,
  sumAllocatedForInvoice,
};
