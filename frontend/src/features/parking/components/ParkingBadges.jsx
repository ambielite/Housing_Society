export function ActiveBadge({ status }) {
  const active = status === 'ACTIVE';
  return <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

const ALLOCATION = {
  ACTIVE: { label: 'Active', className: 'badge-active' },
  EXPIRED: { label: 'Expired', className: 'badge-archived' },
  CANCELLED: { label: 'Cancelled', className: 'badge-suspended' },
};

export function AllocationStatusBadge({ status }) {
  const entry = ALLOCATION[status] || { label: status, className: 'badge-archived' };
  return <span className={`badge ${entry.className}`}>{entry.label}</span>;
}
