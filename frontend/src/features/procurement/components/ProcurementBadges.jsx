const REQUEST = {
  DRAFT: ['badge-archived', 'Draft'],
  SUBMITTED: ['badge-system', 'Submitted'],
  QUOTATION: ['badge-pending', 'Quotation'],
  APPROVAL: ['badge-pending', 'Approval'],
  APPROVED: ['badge-active', 'Approved'],
  REJECTED: ['badge-suspended', 'Rejected'],
  PO_ISSUED: ['badge-active', 'PO issued'],
  CANCELLED: ['badge-archived', 'Cancelled'],
};
const RFQ = { OPEN: ['badge-active', 'Open'], CLOSED: ['badge-archived', 'Closed'] };
const RESPONSE = {
  INVITED: ['badge-pending', 'Invited'],
  RESPONDED: ['badge-active', 'Responded'],
  DECLINED: ['badge-suspended', 'Declined'],
};
const QUOTATION = {
  SUBMITTED: ['badge-pending', 'Submitted'],
  ACCEPTED: ['badge-active', 'Accepted'],
  REJECTED: ['badge-suspended', 'Rejected'],
};

function Pill({ map, status }) {
  const [className, label] = map[status] || ['badge-archived', status];
  return <span className={`badge ${className}`}>{label}</span>;
}

export const RequestStatusBadge = ({ status }) => <Pill map={REQUEST} status={status} />;
export const RfqStatusBadge = ({ status }) => <Pill map={RFQ} status={status} />;
export const ResponseStatusBadge = ({ status }) => <Pill map={RESPONSE} status={status} />;
export const QuotationStatusBadge = ({ status }) => <Pill map={QUOTATION} status={status} />;
