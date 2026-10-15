const statusMap = {
  ACTIVE: ['Active', 'badge-active'],
  INACTIVE: ['Inactive', 'badge-inactive'],
  AVAILABLE: ['Available', 'badge-active'],
  FULL: ['Full', 'badge-pending'],
  BLOCKED: ['Blocked', 'badge-suspended'],
  CANCELLED: ['Cancelled', 'badge-inactive'],
  PENDING_PAYMENT: ['Pending payment', 'badge-pending'],
  CONFIRMED: ['Confirmed', 'badge-active'],
  NO_SHOW: ['No-show', 'badge-suspended'],
  EXPIRED: ['Expired', 'badge-archived'],
};

export function AmenityStatusBadge({ status }) {
  const [label, className] = statusMap[status] || [status, 'badge-archived'];
  return <span className={`badge ${className}`}>{label}</span>;
}

export function SlotStatusBadge({ status }) {
  return <AmenityStatusBadge status={status} />;
}

export function BookingStatusBadge({ status }) {
  return <AmenityStatusBadge status={status} />;
}
