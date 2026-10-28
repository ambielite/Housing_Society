import { label } from './helpdeskOptions';

const STATUS_CLASS = {
  ACTIVE: 'badge-active',
  INACTIVE: 'badge-inactive',
  OPEN: 'badge-system',
  ASSIGNED: 'badge-system',
  IN_PROGRESS: 'badge-system',
  PENDING: 'badge-pending',
  ON_HOLD: 'badge-pending',
  RESOLVED: 'badge-active',
  CLOSED: 'badge-active',
  CANCELLED: 'badge-suspended',
  REJECTED: 'badge-suspended',
};

export default function HelpdeskStatusBadge({ status }) {
  const value = String(status || 'UNKNOWN').toUpperCase();
  return <span className={`badge ${STATUS_CLASS[value] || 'badge-archived'}`}>{label(value)}</span>;
}
