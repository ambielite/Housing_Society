import { getErrorMessage } from '../../../lib/axios';

export const REQUEST_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'QUOTATION', label: 'Quotation' },
  { value: 'APPROVAL', label: 'Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PO_ISSUED', label: 'PO issued' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Mirrors the backend's allowed moves, so the dropdown only offers valid next steps.
export const NEXT_REQUEST_STATUSES = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['QUOTATION', 'CANCELLED'],
  QUOTATION: ['APPROVAL', 'CANCELLED'],
  APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PO_ISSUED', 'CANCELLED'],
  REJECTED: [],
  PO_ISSUED: [],
  CANCELLED: [],
};

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value;

const today = () => new Date().toISOString().slice(0, 10);

// Suggested document numbers, e.g. PR-20261004-4821. The user can overwrite them.
export const suggestNumber = (prefix) => `${prefix}-${today().replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

// A blocked delete comes back from the backend as a "foreign key" error - say it plainly.
export const friendlyDeleteError = (error, what) => {
  const message = getErrorMessage(error);
  return /foreign key|could not be deleted/i.test(message)
    ? `This ${what} can't be deleted because other records (like RFQs) still use it. Cancel it instead.`
    : message;
};
