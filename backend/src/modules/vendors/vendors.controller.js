const service = require('./vendors.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- vendors ---
const createVendor = asyncHandler(async (req, res) => {
  const vendor = await service.createVendor(req.body);
  return ApiResponse.success(res, vendor, 'Vendor created successfully', 201);
});

const listVendors = asyncHandler(async (req, res) => {
  const result = await service.listVendors(req.query, req.user);
  return ApiResponse.success(res, result);
});

const getVendor = asyncHandler(async (req, res) => {
  const vendor = await service.getVendor(req.params.vendorId, req.user);
  return ApiResponse.success(res, vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await service.updateVendor(req.params.vendorId, req.body, req.user);
  return ApiResponse.success(res, vendor, 'Vendor updated successfully');
});

const updateVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await service.updateStatus(req.params.vendorId, req.body.status, req.user);
  return ApiResponse.success(res, vendor, 'Vendor status updated successfully');
});

const deleteVendor = asyncHandler(async (req, res) => {
  await service.deleteVendor(req.params.vendorId, req.user);
  return ApiResponse.success(res, null, 'Vendor deleted successfully');
});

// --- vendor users ---
const listVendorUsers = asyncHandler(async (req, res) => {
  const users = await service.listUsers(req.params.vendorId, req.user);
  return ApiResponse.success(res, users);
});

const linkVendorUser = asyncHandler(async (req, res) => {
  const link = await service.linkUser(req.params.vendorId, req.body.userId, req.user);
  return ApiResponse.success(res, link, 'User linked to vendor successfully', 201);
});

const unlinkVendorUser = asyncHandler(async (req, res) => {
  await service.unlinkUser(req.params.vendorId, req.params.userId, req.user);
  return ApiResponse.success(res, null, 'User unlinked from vendor successfully');
});

// --- contacts ---
const addContact = asyncHandler(async (req, res) => {
  const contact = await service.addContact(req.params.vendorId, req.body, req.user);
  return ApiResponse.success(res, contact, 'Contact added successfully', 201);
});

const listContacts = asyncHandler(async (req, res) => {
  const contacts = await service.listContacts(req.params.vendorId, req.user);
  return ApiResponse.success(res, contacts);
});

const deleteContact = asyncHandler(async (req, res) => {
  await service.deleteContact(req.params.vendorId, req.params.contactId, req.user);
  return ApiResponse.success(res, null, 'Contact deleted successfully');
});

// --- documents ---
const addDocument = asyncHandler(async (req, res) => {
  const document = await service.addDocument(req.params.vendorId, req.body, req.user);
  return ApiResponse.success(res, document, 'Document added successfully', 201);
});

const listDocuments = asyncHandler(async (req, res) => {
  const documents = await service.listDocuments(req.params.vendorId, req.user);
  return ApiResponse.success(res, documents);
});

const verifyDocument = asyncHandler(async (req, res) => {
  const document = await service.verifyDocument(req.params.vendorId, req.params.documentId, req.body.verificationStatus, req.user);
  return ApiResponse.success(res, document, 'Document verification updated');
});

// --- bank accounts ---
const addBankAccount = asyncHandler(async (req, res) => {
  const account = await service.addBankAccount(req.params.vendorId, req.body, req.user);
  return ApiResponse.success(res, account, 'Bank account added successfully', 201);
});

const listBankAccounts = asyncHandler(async (req, res) => {
  const accounts = await service.listBankAccounts(req.params.vendorId, req.user);
  return ApiResponse.success(res, accounts);
});

const verifyBankAccount = asyncHandler(async (req, res) => {
  const account = await service.verifyBankAccount(req.params.vendorId, req.params.bankAccountId, req.user);
  return ApiResponse.success(res, account, 'Bank account verified successfully');
});

// --- contracts ---
const addContract = asyncHandler(async (req, res) => {
  const contract = await service.addContract(req.params.vendorId, req.body, req.user);
  return ApiResponse.success(res, contract, 'Contract added successfully', 201);
});

const listContracts = asyncHandler(async (req, res) => {
  const contracts = await service.listContracts(req.params.vendorId, req.user);
  return ApiResponse.success(res, contracts);
});

const updateContractStatus = asyncHandler(async (req, res) => {
  const contract = await service.updateContractStatus(req.params.vendorId, req.params.contractId, req.body.status, req.user);
  return ApiResponse.success(res, contract, 'Contract status updated successfully');
});

module.exports = {
  createVendor,
  listVendors,
  getVendor,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
  listVendorUsers,
  linkVendorUser,
  unlinkVendorUser,
  addContact,
  listContacts,
  deleteContact,
  addDocument,
  listDocuments,
  verifyDocument,
  addBankAccount,
  listBankAccounts,
  verifyBankAccount,
  addContract,
  listContracts,
  updateContractStatus,
};
