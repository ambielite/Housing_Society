export const PRIORITIES = ['CRITICAL','HIGH','MEDIUM','LOW'];
export const TICKET_STATUSES = ['OPEN','ASSIGNED','IN_PROGRESS','ON_HOLD','RESOLVED','CLOSED'];
export const POLICY_STATUSES = ['ACTIVE','INACTIVE'];
export const THRESHOLD_TYPES = ['WARNING_BEFORE_BREACH','AT_BREACH','MINUTES_AFTER_BREACH'];
export const label = (v='') => String(v).replaceAll('_',' ').toLowerCase().replace(/\b\w/g, c=>c.toUpperCase());
