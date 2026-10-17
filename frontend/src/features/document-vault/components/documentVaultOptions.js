export const FOLDER_TYPES = ['BYLAWS', 'RERA', 'AUDIT_REPORTS', 'AGM_MINUTES', 'CONTRACTS', 'POLICIES', 'OTHER'];
export const DOCUMENT_TYPES = ['BYLAW', 'RERA_CERT', 'AUDIT_REPORT', 'AGM_MINUTES', 'CONTRACT', 'POLICY', 'OTHER'];
export const SENSITIVITIES = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'];
export const VISIBILITIES = ['PUBLIC', 'SOCIETY', 'COMMITTEE_ONLY', 'PRIVATE'];
export const visibilityHelp = (value) => ({
  PUBLIC: 'Any signed-in user assigned to this society can view and download it, even without a role.',
  SOCIETY: 'Users with document read access in this society can view it.',
  COMMITTEE_ONLY: 'Society admins, President/Secretary, Treasurers, the uploader, and explicitly shared users or roles can view it.',
  PRIVATE: 'Only the uploader, society admins, or explicitly shared users or roles can view it.',
}[value] || 'Choose who can view this document.');
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
