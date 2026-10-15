import { getErrorMessage } from '../../../lib/axios';

export const VENDOR_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BLACKLISTED', label: 'Blacklisted' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'ARCHIVED', label: 'Archived' },
];
export const VERIFICATION_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];
export const CONTRACT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TERMINATED', label: 'Terminated' },
];
export const DOCUMENT_TYPES = [
  { value: 'PAN_CARD', label: 'PAN card' },
  { value: 'GST_CERTIFICATE', label: 'GST certificate' },
  { value: 'BANK_PROOF', label: 'Bank proof (cancelled cheque)' },
  { value: 'TRADE_LICENSE', label: 'Trade license' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'AGREEMENT', label: 'Agreement' },
  { value: 'OTHER', label: 'Other' },
];

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value;

// ABCDE1234F -> ABCDE****F (identifiers are masked on screen by default)
export const maskPan = (pan) => (pan && pan.length >= 6 ? `${pan.slice(0, 5)}****${pan.slice(-1)}` : pan || '-');

export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;

// A blocked delete comes back from the backend as a "foreign key" error - say it plainly.
export const friendlyDeleteError = (error, what) => {
  const message = getErrorMessage(error);
  return /foreign key|could not be deleted/i.test(message)
    ? `This ${what} can't be deleted because other records still use it. Set its status to Archived instead.`
    : message;
};
