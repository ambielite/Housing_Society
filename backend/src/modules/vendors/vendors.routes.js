const express = require('express');
const controller = require('./vendors.controller');
const validate = require('../../common/validate');
const {
  createVendorSchema,
  linkVendorUserSchema,
  vendorUserParamsSchema,
  vendorUserLinkParamsSchema,
  listVendorsQuerySchema,
  updateVendorSchema,
  updateVendorStatusSchema,
  addContactSchema,
  addDocumentSchema,
  verifyDocumentSchema,
  addBankAccountSchema,
  addContractSchema,
  updateContractStatusSchema,
} = require('./vendors.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Vendors
router.get('/', authorize('VENDOR_READ'), validate(listVendorsQuerySchema, 'query'), controller.listVendors);
router.post('/', authorize('VENDOR_CREATE'), validate(createVendorSchema), controller.createVendor);
router.get('/:vendorId', authorize('VENDOR_READ'), controller.getVendor);
router.patch('/:vendorId', authorize('VENDOR_UPDATE'), validate(updateVendorSchema), controller.updateVendor);
router.patch(
  '/:vendorId/status',
  authorize('VENDOR_STATUS_UPDATE'),
  validate(updateVendorStatusSchema),
  controller.updateVendorStatus
);
router.delete('/:vendorId', authorize('VENDOR_DELETE'), controller.deleteVendor);

// Existing-user links: vendor is not recreated; only authorized internal users can manage links.
router.get('/:vendorId/users', authorize('USER_READ'), validate(vendorUserParamsSchema, 'params'), controller.listVendorUsers);
router.post('/:vendorId/users', authorize('VENDOR_UPDATE'), validate(vendorUserParamsSchema, 'params'), validate(linkVendorUserSchema), controller.linkVendorUser);
router.delete('/:vendorId/users/:userId', authorize('VENDOR_UPDATE'), validate(vendorUserLinkParamsSchema, 'params'), controller.unlinkVendorUser);

// Contacts
router.post('/:vendorId/contacts', authorize('VENDOR_UPDATE'), validate(addContactSchema), controller.addContact);
router.get('/:vendorId/contacts', authorize('VENDOR_READ'), controller.listContacts);
router.delete('/:vendorId/contacts/:contactId', authorize('VENDOR_UPDATE'), controller.deleteContact);

// Documents
router.post('/:vendorId/documents', authorize('VENDOR_UPDATE'), validate(addDocumentSchema), controller.addDocument);
router.get('/:vendorId/documents', authorize('VENDOR_READ'), controller.listDocuments);
router.patch(
  '/:vendorId/documents/:documentId/verify',
  authorize('VENDOR_UPDATE'),
  validate(verifyDocumentSchema),
  controller.verifyDocument
);

// Bank accounts
router.post(
  '/:vendorId/bank-accounts',
  authorize('VENDOR_UPDATE'),
  validate(addBankAccountSchema),
  controller.addBankAccount
);
router.get('/:vendorId/bank-accounts', authorize('VENDOR_READ'), controller.listBankAccounts);
router.patch(
  '/:vendorId/bank-accounts/:bankAccountId/verify',
  authorize('VENDOR_UPDATE'),
  controller.verifyBankAccount
);

// Contracts
router.post('/:vendorId/contracts', authorize('VENDOR_UPDATE'), validate(addContractSchema), controller.addContract);
router.get('/:vendorId/contracts', authorize('VENDOR_READ'), controller.listContracts);
router.patch(
  '/:vendorId/contracts/:contractId/status',
  authorize('VENDOR_UPDATE'),
  validate(updateContractStatusSchema),
  controller.updateContractStatus
);

module.exports = router;
