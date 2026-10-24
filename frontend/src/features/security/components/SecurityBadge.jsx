import { label } from './securityOptions';

const tone = (value) => {
  const status = String(value || '').toUpperCase();
  if (['ACTIVE', 'ONLINE', 'APPROVED', 'INSIDE', 'ARRIVED', 'PICKED_UP', 'COLLECTED', 'NONE', 'PROCESSED', 'PRESENT', 'COMPLETED', 'RESOLVED', 'CONFIRMED', 'VERIFIED', 'CLOSED'].includes(status)) return 'badge-active';
  if (['SUSPENDED', 'BLACKLISTED', 'OVERSTAY', 'ERROR', 'LOST', 'DAMAGED', 'REJECTED', 'CANCELLED', 'ABSENT', 'MISSED', 'FAILED', 'CRITICAL'].includes(status)) return 'badge-suspended';
  if (['PENDING', 'EXPECTED', 'STORED', 'OPEN', 'OFFLINE', 'RECEIVED', 'LATE', 'RESPONDING', 'HIGH'].includes(status)) return 'badge-pending';
  if (['SCHEDULED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'UNDER_INVESTIGATION'].includes(status)) return 'badge-system';
  if (['INACTIVE', 'EXITED', 'EXPIRED', 'TERMINATED'].includes(status)) return 'badge-archived';
  return 'badge-custom';
};

export default function SecurityBadge({ value }) {
  return <span className={`badge ${tone(value)}`}>{label(value)}</span>;
}
