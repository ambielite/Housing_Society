const VEHICLE = {
  ACTIVE: ['badge-active', 'Active'],
  INACTIVE: ['badge-inactive', 'Inactive'],
  BLOCKED: ['badge-suspended', 'Blocked'],
  SOLD_TRANSFERRED: ['badge-archived', 'Sold / transferred'],
};
const CREDENTIAL = {
  ACTIVE: ['badge-active', 'Active'],
  REVOKED: ['badge-suspended', 'Revoked'],
  EXPIRED: ['badge-archived', 'Expired'],
};
const VISIT = {
  INSIDE: ['badge-active', 'Inside'],
  EXITED: ['badge-archived', 'Exited'],
  OVERSTAY: ['badge-suspended', 'Overstay'],
  CANCELLED: ['badge-archived', 'Cancelled'],
};

function Pill({ map, status }) {
  const [className, label] = map[status] || ['badge-archived', status];
  return <span className={`badge ${className}`}>{label}</span>;
}

export const VehicleStatusBadge = ({ status }) => <Pill map={VEHICLE} status={status} />;
export const CredentialStatusBadge = ({ status }) => <Pill map={CREDENTIAL} status={status} />;
export const VisitStatusBadge = ({ status }) => <Pill map={VISIT} status={status} />;
