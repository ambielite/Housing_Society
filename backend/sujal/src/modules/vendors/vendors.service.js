const ApiError = require('../../common/ApiError');
const { getPagination } = require('../../common/pagination');
const repository = require('./vendors.repository');
const usersRepository = require('../users/users.repository');

/**
 * A caller whose ONLY role is VENDOR must be restricted to their own
 * vendor record (per spec Section 15: "Vendor portal access restricted
 * to assigned scope"). Admin-type roles (or SUPER_ADMIN, who bypasses
 * authorize() entirely) are never restricted here.
 */
const isVendorOnly = (actingUser) =>
  !!actingUser && actingUser.roles.length === 1 && actingUser.roles[0] === 'VENDOR';

// --- vendors ---------------------------------------------------------------

const assertVendorScope = async (vendorId, actingUser) => {
  if (!isVendorOnly(actingUser)) return;
  const ids = Array.isArray(actingUser.vendorIds) ? actingUser.vendorIds : (actingUser.vendorId ? [actingUser.vendorId] : []);
  if (!ids.includes(vendorId)) throw new ApiError(404, 'Vendor not found');
};

const createVendor = async (payload) => {
  if (payload.userId) {
    const user = await usersRepository.findById(payload.userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.society_id && user.society_id !== payload.societyId) {
      throw new ApiError(400, 'The user and vendor must belong to the same society');
    }
    const existingLink = await repository.findUserVendorLink(payload.userId);
    if (existingLink) throw new ApiError(409, 'This user is already linked to a vendor');
  }
  try {
    return await repository.createVendor(payload);
  } catch (err) {
    if (err.code === '23505') throw new ApiError(409, 'This user is already linked to a vendor');
    throw err;
  }
};

const listVendors = async (query, actingUser) => {
  const { page, limit, offset } = getPagination(query);

  const scopedQuery = { ...query };
  if (isVendorOnly(actingUser)) {
    const ids = Array.isArray(actingUser.vendorIds) ? actingUser.vendorIds : (actingUser.vendorId ? [actingUser.vendorId] : []);
    const vendors = [];
    for (const id of ids) {
      const vendor = await repository.findById(id);
      if (vendor) vendors.push(vendor);
    }
    return { vendors, pagination: { page: 1, limit, total: vendors.length, totalPages: 1 } };
  }

  const { rows, total } = await repository.listVendors({
    societyId: scopedQuery.societyId,
    status: scopedQuery.status,
    search: scopedQuery.search,
    limit,
    offset,
  });
  return {
    vendors: rows,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
};

const getVendor = async (id, actingUser) => {
  const vendor = await repository.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  if (isVendorOnly(actingUser) && !(Array.isArray(actingUser.vendorIds) ? actingUser.vendorIds : [actingUser.vendorId]).includes(vendor.id)) {
    throw new ApiError(403, 'You can only view your own vendor record');
  }
  return vendor;
};

const updateVendor = async (id, payload, actingUser) => {
  await assertVendorScope(id, actingUser);
  const vendor = await repository.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.updateVendor(id, payload);
};

/**
 * Vendor lifecycle per Appendix A: PENDING -> ACTIVE -> SUSPENDED /
 * BLACKLISTED / EXPIRED -> ARCHIVED. Not every transition needs to be
 * blocked here since a human is driving it, but blacklisting/suspension
 * has a real downstream effect enforced elsewhere: purchase-orders.service
 * refuses to issue a new PO to a non-ACTIVE vendor (VND-001).
 */
const updateStatus = async (id, status, actingUser) => {
  await assertVendorScope(id, actingUser);
  const vendor = await repository.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.updateStatus(id, status);
};

const deleteVendor = async (id, actingUser) => {
  await assertVendorScope(id, actingUser);
  const vendor = await repository.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  const deleted = await repository.deleteVendor(id);
  if (!deleted) {
    throw new ApiError(400, 'Vendor could not be deleted (it may have related contracts/orders)');
  }
  return deleted;
};

// --- vendor user links -------------------------------------------------------

const listUsers = async (vendorId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return repository.listVendorUsers(vendorId);
};

const linkUser = async (vendorId, userId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  const user = await usersRepository.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.society_id && user.society_id !== vendor.society_id) {
    throw new ApiError(400, 'The user and vendor must belong to the same society');
  }
  const existing = await repository.findUserVendorLink(userId);
  if (existing) {
    if (existing.vendor_id === vendorId) throw new ApiError(409, 'This user is already linked to this vendor');
    throw new ApiError(409, 'This user is already linked to another vendor');
  }
  try {
    const link = await repository.linkUserToVendor(vendorId, userId, actingUser?.id);
    return { ...link, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, status: user.status } };
  } catch (err) {
    if (err.code === '23505') throw new ApiError(409, 'This user is already linked to a vendor');
    throw err;
  }
};

const unlinkUser = async (vendorId, userId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  const link = await repository.unlinkUserFromVendor(vendorId, userId);
  if (!link) throw new ApiError(404, 'User is not linked to this vendor');
  return link;
};

// --- contacts ---------------------------------------------------------------

const addContact = async (vendorId, payload, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.addContact({ vendorId, ...payload });
};

const listContacts = async (vendorId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.listContacts(vendorId);
};

const deleteContact = async (vendorId, contactId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const contact = await repository.findContactById(contactId);
  if (!contact || contact.vendor_id !== vendorId) {
    throw new ApiError(404, 'Contact not found for this vendor');
  }
  return repository.deleteContact(contactId);
};

// --- documents ----------------------------------------------------------------

const addDocument = async (vendorId, payload, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.addDocument({ vendorId, ...payload });
};

const listDocuments = async (vendorId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.listDocuments(vendorId);
};

const verifyDocument = async (vendorId, documentId, verificationStatus, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const document = await repository.findDocumentById(documentId);
  if (!document || document.vendor_id !== vendorId) {
    throw new ApiError(404, 'Document not found for this vendor');
  }
  return repository.updateDocumentVerification(documentId, verificationStatus);
};

// --- bank accounts --------------------------------------------------------------

const addBankAccount = async (vendorId, payload, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.addBankAccount({ vendorId, ...payload });
};

const listBankAccounts = async (vendorId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.listBankAccounts(vendorId);
};

const verifyBankAccount = async (vendorId, bankAccountId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const account = await repository.findBankAccountById(bankAccountId);
  if (!account || account.vendor_id !== vendorId) {
    throw new ApiError(404, 'Bank account not found for this vendor');
  }
  return repository.verifyBankAccount(bankAccountId);
};

// --- contracts ------------------------------------------------------------------

const addContract = async (vendorId, payload, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.addContract({ vendorId, ...payload });
};

const listContracts = async (vendorId, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const vendor = await repository.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  return repository.listContracts(vendorId);
};

const updateContractStatus = async (vendorId, contractId, status, actingUser) => {
  await assertVendorScope(vendorId, actingUser);
  const contract = await repository.findContractById(contractId);
  if (!contract || contract.vendor_id !== vendorId) {
    throw new ApiError(404, 'Contract not found for this vendor');
  }
  return repository.updateContractStatus(contractId, status);
};

module.exports = {
  createVendor,
  listVendors,
  listUsers,
  linkUser,
  unlinkUser,
  getVendor,
  updateVendor,
  updateStatus,
  deleteVendor,
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
