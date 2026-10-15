export const PO_STATUSES = [
  { value: 'ISSUED', label: 'Issued' },
  { value: 'AMENDED', label: 'Amended' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'BILLED', label: 'Billed' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const PO_STATUS_LABELS = Object.fromEntries(PO_STATUSES.map((item) => [item.value, item.label]));

export const PO_STATUS_TRANSITIONS = {
  ISSUED: ['AMENDED', 'RECEIVED', 'CANCELLED'],
  AMENDED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['BILLED', 'CANCELLED'],
  BILLED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

export const RECEIPT_STATUSES = [
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'REJECTED', label: 'Rejected' },
];
