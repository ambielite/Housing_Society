const service = require('./purchase-orders.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- purchase orders ---
const createPO = asyncHandler(async (req, res) => {
  const po = await service.createPO(req.body);
  return ApiResponse.success(res, po, 'Purchase order issued successfully', 201);
});

const listPOs = asyncHandler(async (req, res) => {
  const pos = await service.listPOs(req.query, req.user);
  return ApiResponse.success(res, pos);
});

const getPO = asyncHandler(async (req, res) => {
  const po = await service.getPO(req.params.poId, req.user);
  return ApiResponse.success(res, po);
});

const updatePOStatus = asyncHandler(async (req, res) => {
  const po = await service.updatePOStatus(req.params.poId, req.body.status);
  return ApiResponse.success(res, po, 'Purchase order status updated successfully');
});

const addPOLine = asyncHandler(async (req, res) => {
  const po = await service.addPOLine(req.params.poId, req.body);
  return ApiResponse.success(res, po, 'Purchase order line added successfully', 201);
});

const listPOLines = asyncHandler(async (req, res) => {
  const lines = await service.listPOLines(req.params.poId, req.user);
  return ApiResponse.success(res, lines);
});

// --- goods receipts ---
const createGoodsReceipt = asyncHandler(async (req, res) => {
  const receipt = await service.createGoodsReceipt(req.body);
  return ApiResponse.success(res, receipt, 'Goods receipt recorded successfully', 201);
});

const listGoodsReceipts = asyncHandler(async (req, res) => {
  const receipts = await service.listGoodsReceipts(req.params.poId);
  return ApiResponse.success(res, receipts);
});

const getGoodsReceipt = asyncHandler(async (req, res) => {
  const receipt = await service.getGoodsReceipt(req.params.receiptId);
  return ApiResponse.success(res, receipt);
});

// --- vendor invoices ---
const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await service.createInvoice(req.body, req.user);
  return ApiResponse.success(res, invoice, 'Vendor invoice recorded successfully', 201);
});

const listInvoices = asyncHandler(async (req, res) => {
  const invoices = await service.listInvoices(req.query, req.user);
  return ApiResponse.success(res, invoices);
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await service.getInvoice(req.params.invoiceId, req.user);
  return ApiResponse.success(res, invoice);
});

const addInvoiceLine = asyncHandler(async (req, res) => {
  const invoice = await service.addInvoiceLine(req.params.invoiceId, req.body, req.user);
  return ApiResponse.success(res, invoice, 'Invoice line added successfully', 201);
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const invoice = await service.updateInvoiceStatus(req.params.invoiceId, req.body.status, req.user);
  return ApiResponse.success(res, invoice, 'Vendor invoice status updated successfully');
});

// --- vendor payments ---
const allocatePayment = asyncHandler(async (req, res) => {
  const payment = await service.allocatePayment({ vendorInvoiceId: req.params.invoiceId, ...req.body }, req.user);
  return ApiResponse.success(res, payment, 'Payment allocated successfully', 201);
});

const listPaymentsForInvoice = asyncHandler(async (req, res) => {
  const payments = await service.listPaymentsForInvoice(req.params.invoiceId, req.user);
  return ApiResponse.success(res, payments);
});

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
