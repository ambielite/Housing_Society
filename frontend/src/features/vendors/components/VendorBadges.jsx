const VENDOR = {
  PENDING: ['badge-pending', 'Pending'],
  ACTIVE: ['badge-active', 'Active'],
  SUSPENDED: ['badge-suspended', 'Suspended'],
  BLACKLISTED: ['badge-suspended', 'Blacklisted'],
  EXPIRED: ['badge-archived', 'Expired'],
  ARCHIVED: ['badge-archived', 'Archived'],
};
const VERIFICATION = {
  PENDING: ['badge-pending', 'Pending'],
  VERIFIED: ['badge-active', 'Verified'],
  REJECTED: ['badge-suspended', 'Rejected'],
};
const CONTRACT = {
  ACTIVE: ['badge-active', 'Active'],
  EXPIRED: ['badge-archived', 'Expired'],
  TERMINATED: ['badge-suspended', 'Terminated'],
};

function Pill({ map, status }) {
  const [className, label] = map[status] || ['badge-archived', status];
  return <span className={`badge ${className}`}>{label}</span>;
}

export const VendorStatusBadge = ({ status }) => <Pill map={VENDOR} status={status} />;
export const VerificationBadge = ({ status }) => <Pill map={VERIFICATION} status={status} />;
export const ContractStatusBadge = ({ status }) => <Pill map={CONTRACT} status={status} />;
