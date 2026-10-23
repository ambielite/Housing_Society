const { authorize } = require('./authMiddleware');

const ACTION_ROUTES = /\/(?:approve|reject|cancel|activate|deactivate|publish|archive|close|complete|confirm|verify|submit|send|acknowledge|reconcile|generate|record|review|vote|cast|restore|sync|run|process|issue|sign|refund|reverse|lock|unlock|assign|unassign|renew|expire|collect|mark|remove|payment-paid|payment-failed|no-show|check-in|check-out|entry|exit)(?:\/[^/]*)?\/?$/i;

const ROUTE_MODULES = [
  ['/community-meeting-action-items', 'COMMUNITY_MEETING_ACTION_ITEM'],
  ['/kyc-documents', 'RESIDENT_VERIFICATION'],
  ['/agreements', 'AGREEMENT'],
  ['/community-meeting-attendance', 'COMMUNITY_MEETING_ATTENDANCE'],
  ['/community-meeting-agendas', 'COMMUNITY_MEETING_AGENDA'],
  ['/community-meeting-minutes', 'COMMUNITY_MEETING_MINUTE'],
  ['/community-governance', 'COMMUNITY_GOVERNANCE'],
  ['/community-classifieds', 'COMMUNITY_CLASSIFIED'],
  ['/community-moderation', 'COMMUNITY_MODERATION'],
  ['/community-meetings', 'COMMUNITY_MEETING'],
  ['/community-events', 'COMMUNITY_EVENT'],
  ['/community-forums', 'COMMUNITY_FORUM'],
  ['/community-groups', 'COMMUNITY_GROUP'],
  ['/community-posts', 'COMMUNITY_POST'],
  ['/community-voting', 'COMMUNITY_VOTING'],
  ['/agreement-notifications', 'AGREEMENT_NOTIFICATION'],
  ['/agreement-reminders', 'AGREEMENT_REMINDER'],
  ['/agreement-renewals', 'AGREEMENT_RENEWAL'],
  ['/billing-responsibilities', 'BILLING_RESPONSIBILITY'],
  ['/financial-clearances', 'FINANCIAL_CLEARANCE'],
  ['/lifecycle-approvals', 'LIFECYCLE_APPROVAL'],
  ['/lifecycle-documents', 'LIFECYCLE_DOCUMENT'],
  ['/lifecycle-audits', 'LIFECYCLE_AUDIT'],
  ['/staff-unit-assignments', 'STAFF_UNIT_ASSIGNMENT'],
  ['/staff-attendance', 'STAFF_ATTENDANCE'],
  ['/staff-documents', 'STAFF_DOCUMENT'],
  ['/asset-maintenance', 'ASSET_MAINTENANCE'],
  ['/maintenance-schedules', 'MAINTENANCE_SCHEDULE'],
  ['/accounts', 'ACCOUNT'],
  ['/accounting-periods', 'ACCOUNTING_PERIOD'],
  ['/accounting-exports', 'ACCOUNTING_EXPORT'],
  ['/cluster-dashboard', 'CLUSTER_DASHBOARD'],
  ['/cluster-reports', 'CLUSTER_REPORT'],
  ['/society-management', 'SOCIETY_MANAGEMENT'],
  ['/society-emergency-contacts', 'SOCIETY_EMERGENCY_CONTACT'],
  ['/society-management-committee', 'SOCIETY_COMMITTEE'],
  ['/society-settings', 'SOCIETY_SETTING'],
  ['/resident-verifications', 'RESIDENT_VERIFICATION'],
  ['/resident-kyc', 'RESIDENT_VERIFICATION'],
  ['/owner-units', 'OWNER_UNIT'],
  ['/non-members', 'NON_MEMBER'],
  ['/billing-scheduler', 'BILLING_SCHEDULER'],
  ['/billing-configs', 'BILLING_CONFIG'],
  ['/general-ledgers', 'GENERAL_LEDGER'],
  ['/ledger-accounts', 'LEDGER_ACCOUNT'],
  ['/trial-balances', 'TRIAL_BALANCE'],
  ['/financial-reports', 'FINANCIAL_REPORT'],
  ['/stock-transactions', 'STOCK_TRANSACTION'],
  ['/asset-categories', 'ASSET_CATEGORY'],
  ['/asset-documents', 'ASSET_DOCUMENT'],
  ['/asset-lifecycle', 'ASSET_LIFECYCLE'],
  ['/asset-qr', 'ASSET_QR'],
  ['/gate-passes', 'GATE_PASS'],
  ['/organizations', 'ORGANIZATION'],
  ['/reconciliations', 'RECONCILIATION'],
  ['/society-access', 'SOCIETY_ACCESS'],
  ['/move-ins', 'MOVE_IN'],
  ['/move-outs', 'MOVE_OUT'],
  ['/occupancies', 'OCCUPANCY'],
  ['/access', 'ACCESS_ASSIGNMENT'],
  ['/journals', 'JOURNAL'],
  ['/billings', 'BILLING'],
  ['/invoices', 'INVOICE'],
  ['/payments', 'PAYMENT'],
  ['/taxes', 'TAX'],
  ['/staff-tasks', 'STAFF_TASK'],
  ['/checkpoints', 'PATROL_CHECKPOINT'],
  ['/security-audits', 'SECURITY_AUDIT'],
  ['/emergencies', 'EMERGENCY'],
  ['/incidents', 'INCIDENT'],
  ['/patrols', 'PATROL'],
  ['/rosters', 'ROSTER'],
  ['/shifts', 'SHIFT'],
  ['/staff', 'STAFF'],
  ['/assets', 'ASSET'],
  ['/inventory', 'INVENTORY'],
  ['/amcs', 'AMC'],
  ['/work-orders', 'WORK_ORDER'],
  ['/broadcasts', 'BROADCAST'],
  ['/notices', 'NOTICE'],
  ['/notifications', 'NOTIFICATION'],
  ['/notification-templates', 'NOTIFICATION_TEMPLATE'],
  ['/notification-preferences', 'NOTIFICATION_PREFERENCE'],
  ['/community', 'COMMUNITY_COMMENT'],
  ['/clusters', 'CLUSTER'],
  ['/multi-society', 'MULTI_SOCIETY'],
  ['/residents', 'RESIDENT'],
  ['/societies', 'SOCIETY'],
  ['/towers', 'TOWER'],
  ['/floors', 'FLOOR'],
  ['/units', 'UNIT'],
  ['/reports/dashboard', 'REPORT_DASHBOARD'],
  ['/reports/finance', 'REPORT_FINANCE'],
  ['/reports/operations', 'REPORT_OPERATIONS'],
  ['/reports/security', 'REPORT_SECURITY'],
  ['/reports/approvals', 'REPORT_APPROVAL'],
];
ROUTE_MODULES.sort((left, right) => right[0].length - left[0].length);

/**
 * Applies the same permission model used by /api/v1 to the older teammate API.
 * Collection POSTs are CREATE; POSTs to named actions and PUT/PATCH are UPDATE.
 */
const authorizeLegacy = (moduleCode) => (req, res, next) => {
  let action;
  if (req.method === 'GET' || req.method === 'HEAD') action = 'READ';
  else if (req.method === 'POST') action = ACTION_ROUTES.test(req.path) ? 'UPDATE' : 'CREATE';
  else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
  else if (req.method === 'DELETE') action = 'DELETE';
  else return next();

  return authorize(`${moduleCode}_${action}`)(req, res, next);
};

const authorizeLegacyRequest = (req, res, next) => {
  const pathname = req.originalUrl.split('?')[0].replace(/^\/api(?=\/)/, '');
  // The notice board and emergency contact directory are readable by every
  // authenticated society user. Mutating actions still require their RBAC
  // permissions through the normal route-to-module mapping below.
  if ((req.method === 'GET' || req.method === 'HEAD') &&
      (/^\/notices(?:\/|$)/i.test(pathname) || /^\/society-emergency-contacts(?:\/|$)/i.test(pathname))) {
    return next();
  }
  // Marking a notice read is a read permission operation even though it uses POST.
  if (req.method === 'POST' && /^\/notices\/[^/]+\/read\/?$/i.test(pathname)) {
    return next();
  }
  if (req.method === 'POST' && /^\/notices\/[^/]+\/template\/?$/i.test(pathname)) {
    return authorize('NOTICE_UPDATE')(req, res, next);
  }
  if (/^\/community-events\/(?:rsvps(?:\/|$)|events\/[^/]+\/rsvp(?:\/|$))/.test(pathname)) {
    return authorizeLegacy('COMMUNITY_EVENT_RSVP')(req, res, next);
  }
  if (/^\/community-groups\/[^/]+\/members(?:\/|$)/.test(pathname)) {
    return authorizeLegacy('COMMUNITY_GROUP_MEMBER')(req, res, next);
  }
  const match = ROUTE_MODULES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!match) {
    return res.status(403).json({ success: false, message: 'No role permission is configured for this API route' });
  }
  return authorizeLegacy(match[1])(req, res, next);
};

module.exports = { authorizeLegacy, authorizeLegacyRequest };
