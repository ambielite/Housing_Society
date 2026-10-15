const STATUS = {
  PENDING: ['badge-pending', 'Pending'],
  APPROVED: ['badge-active', 'Approved'],
  REJECTED: ['badge-suspended', 'Rejected'],
  INFO_REQUIRED: ['badge-pending', 'Info required'],
  CANCELLED: ['badge-archived', 'Cancelled'],
};

function Pill({ status }) {
  const [className, label] = STATUS[status] || ['badge-archived', status || '-'];
  return <span className={`badge ${className}`}>{label}</span>;
}

export const ApprovalStatusBadge = ({ status }) => <Pill status={status} />;
