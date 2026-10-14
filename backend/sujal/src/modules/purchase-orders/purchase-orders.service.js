const ApiError = require('../../common/ApiError');
const repository = require('./purchase-orders.repository');
const vendorsRepository = require('../vendors/vendors.repository');
const documentRepository = require('../document-folders/document-folders.repository');
const assertVendorInvoiceScope = (invoice, actingUser) => {
  if (isVendorOnly(actingUser) && (!actingUser.vendorId || invoice.vendor_id !== actingUser.vendorId)) {
    throw new ApiError(404, 'Vendor invoice not found');
  }
};

const isVendorOnly = (actingUser) =>
  !!actingUser && actingUser.roles.length === 1 && actingUser.roles[0] === 'VENDOR';

// --- purchase orders --------------------------------------------------------

/**
 * VND-001 (spec Appendix D acceptance criteria): "A suspended/blacklisted
 * vendor cannot receive new purchase orders." Enforced here, not just as
 * a status flag on the vendor.
 */
const createPO = async ({ societyId, vendorId, purchaseRequestId, poNo, poDate, deliveryDate }) => {
  const vendor = await vendorsRepository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  if (vendor.status !== 'ACTIVE') {
    throw new ApiError(400, `Cannot issue a purchase order to a vendor with status ${vendor.status}`);
  }

  const existing = await repository.findPOByNo(poNo);
  if (existing) {
    throw new ApiError(409, 'A purchase order with this PO number already exists');
  }

  return repository.createPO({ societyId, vendorId, purchaseRequestId, poNo, poDate, deliveryDate });
};

const listPOs = (query, actingUser) => {
  if (isVendorOnly(actingUser)) {
    if (!actingUser.vendorId) return [];
    return repository.listPOs({ ...query, vendorId: actingUser.vendorId });
  }
  return repository.listPOs(query);
};

const getPO = async (id, actingUser) => {
  const po = await repository.findPOById(id);
  if (!po) {
    throw new ApiError(404, 'Purchase order not found');
  }
  if (isVendorOnly(actingUser) && po.vendor_id !== actingUser.vendorId) {
    throw new ApiError(403, 'You can only view your own purchase orders');
  }
  const lines = await repository.listPOLines(id);
  return { ...po, lines };
};

const ALLOWED_PO_TRANSITIONS = {
  ISSUED: ['AMENDED', 'RECEIVED', 'CANCELLED'],
  AMENDED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['BILLED', 'CANCELLED'],
  BILLED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

const updatePOStatus = async (id, status) => {
  const po = await repository.findPOById(id);
  if (!po) {
    throw new ApiError(404, 'Purchase order not found');
  }
  const allowed = ALLOWED_PO_TRANSITIONS[po.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot move a ${po.status} purchase order to ${status}`);
  }
  return repository.updatePOStatus(id, status);
};

const addPOLine = async (purchaseOrderId, payload) => {
  const po = await repository.findPOById(purchaseOrderId);
  if (!po) {
    throw new ApiError(404, 'Purchase order not found');
  }
  await repository.addPOLine({ purchaseOrderId, ...payload });
  return repository.recalculatePOTotals(purchaseOrderId);
};

const listPOLines = async (purchaseOrderId, actingUser) => {
  const po = await repository.findPOById(purchaseOrderId);
  if (!po) {
    throw new ApiError(404, 'Purchase order not found');
  }
  if (isVendorOnly(actingUser) && (!actingUser.vendorId || po.vendor_id !== actingUser.vendorId)) throw new ApiError(404, 'Purchase order not found');
  return repository.listPOLines(purchaseOrderId);
};

// --- goods receipts -----------------------------------------------------------

const createGoodsReceipt = async ({ purchaseOrderId, receiptNo, receivedBy, status, lines }) => {
  const po = await repository.findPOById(purchaseOrderId);
  if (!po) {
    throw new ApiError(404, 'Purchase order not found');
  }
  if (po.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot record a receipt against a cancelled purchase order');
  }

  const receipt = await repository.createGoodsReceipt({ purchaseOrderId, receiptNo, receivedBy, status });

  for (const line of lines || []) {
    const poLine = await repository.findPOLineById(line.poLineId);
    if (!poLine || poLine.purchase_order_id !== purchaseOrderId) {
      throw new ApiError(400, `PO line ${line.poLineId} does not belong to this purchase order`);
    }
    await repository.addGoodsReceiptLine({ goodsReceiptId: receipt.id, ...line });
  }

  // Move the PO forward to RECEIVED unless it's already further along
  if (po.status === 'ISSUED' || po.status === 'AMENDED') {
    await repository.updatePOStatus(purchaseOrderId, 'RECEIVED');
  }

  return getGoodsReceipt(receipt.id);
};

const listGoodsReceipts = async (purchaseOrderId) => {
  const po = await repository.findPOById(purchaseOrderId);
  if (!po) {
    throw new ApiError(404, 'Purchase order not found');
  }
  return repository.listGoodsReceipts(purchaseOrderId);
};

const getGoodsReceipt = async (id) => {
  const receipt = await repository.findGoodsReceiptById(id);
  if (!receipt) {
    throw new ApiError(404, 'Goods receipt not found');
  }
  const lines = await repository.listGoodsReceiptLines(id);
  return { ...receipt, lines };
};

// --- vendor invoices ------------------------------------------------------------

const createInvoice = async ({ vendorId, purchaseOrderId, invoiceNo, invoiceDate, dueDate, documentId }, actingUser) => {
  if (isVendorOnly(actingUser)) {
    if (!actingUser.vendorId) throw new ApiError(403, 'Your user is not linked to a vendor');
    if (vendorId !== actingUser.vendorId) throw new ApiError(403, 'You can only create invoices for your own vendor');
    vendorId = actingUser.vendorId;
    if (documentId) {
      const documentAllowed = await documentRepository.isDocumentLinkedToVendorScope(documentId, [vendorId]);
      if (!documentAllowed) throw new ApiError(404, 'Document not found');
    }
  }
  const vendor = await vendorsRepository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  if (purchaseOrderId) {
    const po = await repository.findPOById(purchaseOrderId);
    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }
    if (po.vendor_id !== vendorId) {
      throw new ApiError(400, 'This purchase order does not belong to the specified vendor');
    }
  }

  const existing = await repository.findInvoiceByNo(vendorId, invoiceNo);
  if (existing) {
    throw new ApiError(409, 'An invoice with this number already exists for this vendor');
  }

  return repository.createInvoice({ vendorId, purchaseOrderId, invoiceNo, invoiceDate, dueDate, documentId });
};

const listInvoices = (query, actingUser) => {
  if (isVendorOnly(actingUser)) {
    if (!actingUser.vendorId) return [];
    return repository.listInvoices({ ...query, vendorId: actingUser.vendorId });
  }
  return repository.listInvoices(query);
};

const getInvoice = async (id, actingUser) => {
  const invoice = await repository.findInvoiceById(id);
  if (!invoice) {
    throw new ApiError(404, 'Vendor invoice not found');
  }
  if (isVendorOnly(actingUser) && invoice.vendor_id !== actingUser.vendorId) {
    throw new ApiError(404, 'Vendor invoice not found');
  }
  const lines = await repository.listInvoiceLines(id);
  const payments = await repository.listPaymentsForInvoice(id);
  return { ...invoice, lines, payments };
};

const addInvoiceLine = async (vendorInvoiceId, payload, actingUser) => {
  const invoice = await repository.findInvoiceById(vendorInvoiceId);
  if (!invoice) {
    throw new ApiError(404, 'Vendor invoice not found');
  }
  assertVendorInvoiceScope(invoice, actingUser);
  if (payload.poLineId) {
    const poLine = await repository.findPOLineById(payload.poLineId);
    if (!poLine) throw new ApiError(404, 'Purchase order line not found');
    const po = await repository.findPOById(poLine.purchase_order_id);
    if (!po || po.vendor_id !== invoice.vendor_id || (invoice.purchase_order_id && po.id !== invoice.purchase_order_id)) {
      throw new ApiError(400, 'The purchase order line must belong to this invoice vendor and purchase order');
    }
  }
  await repository.addInvoiceLine({ vendorInvoiceId, ...payload });
  return repository.recalculateInvoiceTotals(vendorInvoiceId);
};

const ALLOWED_INVOICE_TRANSITIONS = {
  DRAFT: ['VERIFIED', 'CANCELLED'],
  VERIFIED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

const updateInvoiceStatus = async (id, status, actingUser) => {
  const invoice = await repository.findInvoiceById(id);
  if (!invoice) {
    throw new ApiError(404, 'Vendor invoice not found');
  }
  assertVendorInvoiceScope(invoice, actingUser);
  const allowed = ALLOWED_INVOICE_TRANSITIONS[invoice.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot move a ${invoice.status} invoice to ${status}`);
  }
  return repository.updateInvoiceStatus(id, status);
};

// --- vendor payments --------------------------------------------------------------

/**
 * payment_id has no FK yet (Phase 7 - teammate's Payments module is in
 * progress). Store whatever UUID is given, don't validate it against a
 * real payments table until that phase lands.
 */
const allocatePayment = async ({ vendorInvoiceId, paymentId, allocatedAmount }, actingUser) => {
  const invoice = await repository.findInvoiceById(vendorInvoiceId);
  if (!invoice) {
    throw new ApiError(404, 'Vendor invoice not found');
  }
  assertVendorInvoiceScope(invoice, actingUser);
  if (invoice.status !== 'APPROVED') {
    throw new ApiError(400, 'Only APPROVED invoices can receive a payment allocation');
  }

  const alreadyAllocated = await repository.sumAllocatedForInvoice(vendorInvoiceId);
  const remaining = parseFloat(invoice.total) - alreadyAllocated;
  if (allocatedAmount > remaining) {
    throw new ApiError(400, `Allocated amount exceeds the remaining balance of ${remaining.toFixed(2)}`);
  }

  const payment = await repository.allocatePayment({ vendorInvoiceId, paymentId, allocatedAmount });

  const newTotal = alreadyAllocated + allocatedAmount;
  if (newTotal >= parseFloat(invoice.total)) {
    await repository.updateInvoiceStatus(vendorInvoiceId, 'PAID');
  }

  return payment;
};

const listPaymentsForInvoice = async (vendorInvoiceId, actingUser) => {
  const invoice = await repository.findInvoiceById(vendorInvoiceId);
  if (!invoice) {
    throw new ApiError(404, 'Vendor invoice not found');
  }
  assertVendorInvoiceScope(invoice, actingUser);
  return repository.listPaymentsForInvoice(vendorInvoiceId);
};

module.exports = {
  createPO,
  listPOs,
  getPO,
  updatePOStatus,
  addPOLine,
  listPOLines,
  createGoodsReceipt,
  listGoodsReceipts,
  getGoodsReceipt,
  createInvoice,
  listInvoices,
  getInvoice,
  addInvoiceLine,
  updateInvoiceStatus,
  allocatePayment,
  listPaymentsForInvoice,
};
