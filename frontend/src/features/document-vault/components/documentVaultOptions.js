export const FOLDER_TYPES = ['BYLAWS', 'RERA', 'AUDIT_REPORTS', 'AGM_MINUTES', 'CONTRACTS', 'POLICIES', 'OTHER'];
export const DOCUMENT_TYPES = ['BYLAW', 'RERA_CERT', 'AUDIT_REPORT', 'AGM_MINUTES', 'CONTRACT', 'POLICY', 'OTHER'];
export const SENSITIVITIES = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'];
export const VISIBILITIES = ['PUBLIC', 'COMMITTEE_ONLY', 'PRIVATE'];
export const DOCUMENT_STATUSES = ['ACTIVE', 'ARCHIVED', 'DELETED'];
export const FOLDER_STATUSES = ['ACTIVE', 'INACTIVE'];
export const PERMISSION_TYPES = ['READ', 'DOWNLOAD', 'MANAGE'];
export const ENTITY_TYPES = ['VENDOR_CONTRACT', 'TICKET', 'PURCHASE_ORDER', 'VISITOR_PROFILE', 'OTHER'];
export const LINK_TYPES = ['ATTACHMENT', 'REFERENCE'];
export const pretty = (value = '') => String(value).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
export const formatBytes = (bytes) => {
  const size = Number(bytes);
  if (!Number.isFinite(size)) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
export const formatDate = (value) => value ? new Date(value).toLocaleString() : '-';
