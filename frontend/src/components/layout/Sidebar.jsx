import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Archive, Bell, Boxes, Building2, CalendarClock, CalendarDays, Car, CircleParking,
  ChartNoAxesCombined, CheckCircle, ChevronDown, ClipboardCheck, ClipboardList, Coins,
  FileCheck2, FileText, FolderArchive, Gauge, Home, KeyRound, Layers3,
  LayoutDashboard, Landmark, LifeBuoy, LogOut, Megaphone, MessageSquare, Network,
  Package, ParkingSquare, PhoneCall, Settings, Settings2, Shield, ShieldCheck, Siren, Tag, Truck,
  Users, UsersRound, Wallet,
} from 'lucide-react';
import useAuth from '../../app/providers/useAuth';
import { useUi } from '../../app/store/ui.store';

// Navigation points only to routes already registered in app/router. Each
// destination page continues to load its data through its existing API module.
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Home', to: '/housing-dashboard', permission: ['SOCIETY_READ', 'RESIDENT_READ', 'ASSET_READ', 'ACCOUNT_READ'], icon: Building2 },
  {
    key: 'manage-society', label: 'Manage Society', to: '/societies', icon: Landmark,
    children: [
      {
        key: 'societies', label: 'Societies', to: '/societies', permission: 'SOCIETY_READ', icon: Building2,
        children: [
          { label: 'Towers', to: '/towers', permission: 'TOWER_READ', icon: Layers3 },
          { label: 'Floors', to: '/floors', permission: 'FLOOR_READ', icon: Boxes },
          { label: 'Units', to: '/units', permission: 'UNIT_READ', icon: Home },
        ],
      },
      { label: 'Notice', to: '/notices', permission: 'NOTICE_READ', icon: Bell },
      { label: 'Emergency contacts', to: '/emergency-contacts', permission: 'SOCIETY_EMERGENCY_CONTACT_READ', icon: PhoneCall },
      { label: 'Management committee', to: '/management-committee', permission: 'SOCIETY_COMMITTEE_READ', icon: UsersRound },
      { label: 'Document Vault', to: '/document-vault', icon: FolderArchive },
      { label: 'User Management', to: '/users', permission: 'USER_READ', icon: Users },
      { label: 'Roles Management', to: '/roles', permission: 'ROLE_READ', icon: ShieldCheck },
    ],
  },
  {
    key: 'manage-resident', label: 'Manage Resident', to: '/residents', icon: UsersRound,
    children: [
      {
        key: 'residents', label: 'Resident', to: '/residents', permission: 'RESIDENT_READ', icon: Users,
        children: [
          { label: 'Verification', to: '/residents/verification', permission: 'RESIDENT_VERIFICATION_READ', icon: ClipboardCheck },
          { label: 'Non-members', to: '/residents/non-members', permission: 'NON_MEMBER_READ', icon: Building2 },
        ],
      },
      {
        label: 'Move-in / Move-out', to: '/move-in-out', permission: ['MOVE_IN_READ', 'MOVE_OUT_READ'], icon: ClipboardList,
        children: [
          { label: 'Move-ins', to: '/move-in-out/move-ins', permission: 'MOVE_IN_READ', icon: ClipboardCheck },
          { label: 'Move-outs', to: '/move-in-out/move-outs', permission: 'MOVE_OUT_READ', icon: CalendarDays },
        ],
      },
      { label: 'Ownership', to: '/residents/ownership', permission: 'OWNER_UNIT_READ', icon: KeyRound },
      { label: 'Agreements', to: '/move-in-out/agreements', permission: 'AGREEMENT_READ', icon: FileText },
      { label: 'Reminders', to: '/move-in-out/renewals', permission: ['AGREEMENT_RENEWAL_READ', 'AGREEMENT_REMINDER_READ'], icon: Bell },
    ],
  },
  {
    label: 'Finance', to: '/finance', permission: ['ACCOUNT_READ', 'BILLING_READ', 'INVOICE_READ', 'PAYMENT_READ', 'FINANCIAL_REPORT_READ', 'SOCIETY_BANK_ACCOUNT_READ', 'OTHER_INCOME_READ'], icon: Wallet,
    children: [
      { label: 'Periods', to: '/finance/periods', permission: 'ACCOUNTING_PERIOD_READ', icon: CalendarDays },
      { label: 'Accounts', to: '/finance/accounts', permission: 'ACCOUNT_READ', icon: LayoutDashboard },
      
      { label: 'Billing', to: '/finance/billing', permission: 'BILLING_READ', icon: FileCheck2 },
      { label: 'Taxes', to: '/finance/taxes', permission: 'TAX_READ', icon: ChartNoAxesCombined },
      { label: 'Invoices', to: '/finance/invoices', permission: 'INVOICE_READ', icon: FileText },
      { label: 'Payments', to: '/finance/payments', permission: 'PAYMENT_READ', icon: Wallet },
      { label: 'Other income', to: '/finance/other-income', permission: 'OTHER_INCOME_READ', icon: Coins },
      { label: 'Journals', to: '/finance/journals', permission: 'JOURNAL_READ', icon: FileText },
      { label: 'Ledgers', to: '/finance/ledgers', permission: ['LEDGER_ACCOUNT_READ', 'GENERAL_LEDGER_READ'], icon: Archive },
      
    ],
  },
  {
    label: ' Staff & Visitors', to: '/security-operations', icon: UsersRound,
    children: [
      { label: 'Staff & documents', to: '/security-operations/staff', permission: 'STAFF_READ', icon: Users },
      { label: 'Attendance', to: '/security-operations/attendance', permission: 'STAFF_ATTENDANCE_READ', icon: ClipboardCheck },
      { label: 'Shifts & rosters', to: '/security-operations/rosters', permission: ['SHIFT_READ', 'ROSTER_READ'], icon: CalendarDays },
      { label: 'Tasks', to: '/security-operations/tasks', permission: 'STAFF_TASK_READ', icon: CheckCircle },
      { label: 'Patrols', to: '/security-operations/patrols', permission: 'PATROL_READ', icon: ShieldCheck },
      { label: 'Incidents', to: '/security-operations/incidents', permission: 'INCIDENT_READ', icon: Siren },
      { label: 'Emergencies', to: '/security-operations/emergencies', permission: 'EMERGENCY_READ', icon: Siren },
      
      {
        label: 'Gates & visitor access', to: '/security-operations/gates', icon: Shield,
        permission: ['GATE_READ', 'VISITOR_PROFILE_READ', 'DELIVERY_READ'],
      },
    ],
  },
  {
    label: 'Assets & Inventory', to: '/assets', permission: ['ASSET_READ', 'INVENTORY_READ', 'ASSET_MAINTENANCE_READ'], icon: Package,
    children: [
      { label: 'Asset register', to: '/assets/assets', permission: 'ASSET_READ', icon: Package },
      { label: 'Inventory', to: '/assets/inventory', permission: 'INVENTORY_READ', icon: Boxes },
      { label: 'Maintenance', to: '/assets/maintenance', permission: 'ASSET_MAINTENANCE_READ', icon: Settings2 },
      { label: 'AMCs', to: '/assets/contracts', permission: 'AMC_READ', icon: ShieldCheck },
      { label: 'Lifecycle & reminders', to: '/assets/reminders', permission: 'ASSET_LIFECYCLE_READ', icon: Bell },
      { label: 'Categories', to: '/assets/categories', permission: 'ASSET_CATEGORY_READ', icon: Tag },
    ],
  },
  {
    key: 'purchase-workflow', label: 'Purchase request & order', to: '/procurement/requests', permission: ['PURCHASE_REQUEST_READ', 'PURCHASE_ORDER_READ'], icon: ClipboardList,
    children: [
      { label: 'Purchase Requests', to: '/procurement/requests', permission: 'PURCHASE_REQUEST_READ', icon: ClipboardList },
      { label: 'Purchase Orders', to: '/purchase-orders', permission: 'PURCHASE_ORDER_READ', icon: FileText },
      { label: 'Approvals', to: '/approvals', permission: 'APPROVAL_READ', icon: CheckCircle },
    ],
  },
  { label: 'Manage Vendors', to: '/vendors', permission: 'VENDOR_READ', icon: Truck },
  {
    label: 'Notifications', to: '/notifications', permission: ['NOTIFICATION_READ', 'NOTIFICATION_TEMPLATE_READ', 'BROADCAST_READ'], icon: CalendarDays,
    children: [
      { label: 'Notifications', to: '/notifications/notifications', permission: 'NOTIFICATION_READ', icon: Bell },
      { label: 'Templates', to: '/notifications/templates', permission: 'NOTIFICATION_TEMPLATE_READ', icon: FileText },
      { label: 'Preferences', to: '/notifications/preferences', permission: 'NOTIFICATION_PREFERENCE_READ', icon: Settings2 },
      { label: 'Broadcasts', to: '/notifications/broadcasts', permission: 'BROADCAST_READ', icon: Megaphone },
      { label: 'Delivery reports', to: '/notifications/reports', permission: 'NOTIFICATION_READ', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Community', to: '/community', permission: ['COMMUNITY_GROUP_READ', 'COMMUNITY_FORUM_READ', 'COMMUNITY_EVENT_READ', 'COMMUNITY_MEETING_READ'], icon: MessageSquare,
    children: [
      { label: 'Groups & members', to: '/community/groups', permission: 'COMMUNITY_GROUP_READ', icon: Users },
      { label: 'Forums & discussions', to: '/community/forums', permission: ['COMMUNITY_FORUM_READ', 'COMMUNITY_POST_READ'], icon: MessageSquare },
      { label: 'Classifieds', to: '/community/classifieds', permission: 'COMMUNITY_CLASSIFIED_READ', icon: FileText },
      { label: 'Events & RSVPs', to: '/community/events', permission: 'COMMUNITY_EVENT_READ', icon: CalendarDays },
      { label: 'Meetings', to: '/community/meetings', permission: 'COMMUNITY_MEETING_READ', icon: CalendarClock },
      { label: 'AGM / SGM', to: '/community/governance', permission: 'COMMUNITY_GOVERNANCE_READ', icon: FileCheck2 },
      { label: 'Moderation', to: '/community/moderation', permission: 'COMMUNITY_MODERATION_READ', icon: Shield },
      { label: 'Voting & rules', to: '/community/voting', permission: 'COMMUNITY_VOTING_READ', icon: CheckCircle },
    ],
  },
  {
    key: 'parking-management', label: 'Parking Management', to: '/parking',
    permission: ['PARKING_AREA_READ', 'PARKING_SLOT_READ', 'PARKING_ALLOCATION_READ', 'VEHICLE_READ'], icon: CircleParking,
    children: [
      { label: 'Parking', to: '/parking?tab=areas', parkingTab: 'areas', permission: ['PARKING_AREA_READ', 'PARKING_SLOT_READ', 'PARKING_ALLOCATION_READ'], icon: ParkingSquare },
      { label: 'Vehicles', to: '/parking?tab=vehicles', parkingTab: 'vehicles', permission: 'VEHICLE_READ', icon: Car },
    ],
  },
  { label: 'Reports', to: '/reports', permission: ['REPORT_DASHBOARD_READ', 'REPORT_FINANCE_READ', 'REPORT_OPERATIONS_READ', 'REPORT_SECURITY_READ', 'REPORT_APPROVAL_READ', 'REPORT_HELPDESK_READ', 'REPORT_VENDOR_READ', 'REPORT_PROCUREMENT_READ', 'REPORT_AMENITY_READ', 'REPORT_UTILITY_READ'], icon: ChartNoAxesCombined },
  { label: 'Multi-society', to: '/multi-society', permission: ['ORGANIZATION_READ', 'CLUSTER_READ', 'MULTI_SOCIETY_READ'], icon: Network },
  { label: 'Amenities', to: '/amenities', permission: ['AMENITY_READ', 'AMENITY_SLOT_READ', 'AMENITY_BOOKING_READ'], icon: CalendarDays },
  { label: 'Helpdesk', to: '/helpdesk/tickets', permission: 'TICKET_READ', icon: LifeBuoy },
  { label: 'Utility & Meters', to: '/utilities', permission: ['UTILITY_TYPE_READ', 'METER_READ', 'METER_READING_READ', 'UTILITY_TARIFF_READ', 'UTILITY_BILL_READ'], icon: Gauge },
  { label: 'Account Settings', to: '/finance/account-settings', permission: 'SOCIETY_BANK_ACCOUNT_READ', icon: Landmark },
  { label: 'Settings', to: '/settings', permission: 'SOCIETY_SETTING_READ', icon: Settings },
];

const canSee = (item, hasAnyPermission) => !item.permission || hasAnyPermission(item.permission);
const matchesPath = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);
const visibleTree = (items, hasAnyPermission) => items
  .map((item) => ({ ...item, children: item.children ? visibleTree(item.children, hasAnyPermission) : undefined }))
  .filter((item) => canSee(item, hasAnyPermission) || item.children?.length);
const itemIsActive = (item, pathname, search) => (item.parkingTab
  ? pathname === '/parking' && new URLSearchParams(search).get('tab') === item.parkingTab
  : matchesPath(pathname, item.to))
  || item.children?.some((child) => itemIsActive(child, pathname, search));
const groupAncestors = (items, targetKey, ancestors = []) => {
  for (const item of items) {
    const key = item.key || item.to;
    if (key === targetKey) return ancestors;
    if (item.children?.length) {
      const found = groupAncestors(item.children, targetKey, [...ancestors, key]);
      if (found) return found;
    }
  }
  return null;
};
export default function Sidebar() {
  const { hasAnyPermission, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useUi();
  const { pathname, search } = useLocation();
  const [openGroups, setOpenGroups] = useState(() => new Set());

  const visibleItems = visibleTree(NAV_ITEMS, hasAnyPermission);
  const societyOverview = visibleItems.find((item) => item.to === '/housing-dashboard');
  const orderedItems = [
    ...(societyOverview ? [societyOverview] : []),
    ...visibleItems.filter((item) => item !== societyOverview && item.children?.length),
    ...visibleItems.filter((item) => item !== societyOverview && !item.children?.length),
  ];
  const manageVendors = orderedItems.find((item) => item.to === '/vendors');
  const purchaseWorkflowIndex = orderedItems.findIndex((item) => item.key === 'purchase-workflow');
  if (manageVendors && purchaseWorkflowIndex >= 0) {
    orderedItems.splice(orderedItems.indexOf(manageVendors), 1);
    orderedItems.splice(purchaseWorkflowIndex + 1, 0, { ...manageVendors, label: 'Manage Vendors' });
  }
  const amenitiesItem = orderedItems.find((item) => item.to === '/amenities');
  const manageVendorsIndex = orderedItems.findIndex((item) => item.to === '/vendors');
  if (amenitiesItem && manageVendorsIndex >= 0) {
    orderedItems.splice(orderedItems.indexOf(amenitiesItem), 1);
    orderedItems.splice(manageVendorsIndex + 1, 0, amenitiesItem);
  }
  const helpdeskItem = orderedItems.find((item) => item.to === '/helpdesk/tickets');
  const amenitiesIndex = orderedItems.findIndex((item) => item.to === '/amenities');
  if (helpdeskItem && amenitiesIndex >= 0) {
    orderedItems.splice(orderedItems.indexOf(helpdeskItem), 1);
    orderedItems.splice(orderedItems.findIndex((item) => item.to === '/amenities') + 1, 0, helpdeskItem);
  }

  const toggleGroup = (key) => setOpenGroups((current) => {
    const ancestors = groupAncestors(orderedItems, key) || [];
    if (current.has(key)) return new Set(ancestors);
    // Keep only this group's path open so other sections and nested groups close.
    return new Set([...ancestors, key]);
  });
  const handleNavigationClick = (key, hasChildren) => {
    if (hasChildren) {
      toggleGroup(key);
    }
    closeSidebar();
  };

  const renderNavigationItem = (item, depth = 0) => {
    const Icon = item.icon;
    const children = item.children || [];
    const hasChildren = children.length > 0;
    const key = item.key || item.to;
    const expanded = openGroups.has(key);
    const active = itemIsActive(item, pathname, search);
    const destination = canSee(item, hasAnyPermission) ? item.to : children[0]?.to || item.to;
    const submenuId = `sidebar-submenu-${key.replaceAll('/', '-').replaceAll(' ', '-').toLowerCase()}`;

    return (
      <div className={`sidebar-nav-group${depth ? ' sidebar-nested-group' : ''}`} key={key}>
        <div className={`sidebar-nav-group-heading${depth ? ' sidebar-subnav-group-heading' : ''}`}>
          {['manage-society', 'manage-resident', 'purchase-workflow'].includes(key) ? (
            <button
              type="button"
              className={`nav-item${active ? ' active' : ''}`}
              aria-expanded={expanded}
              aria-controls={submenuId}
              onClick={() => toggleGroup(key)}
            >
              <Icon size={depth ? 16 : 18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ) : (
            item.parkingTab ? (
              <Link
                to={destination}
                onClick={() => handleNavigationClick(key, hasChildren)}
                className={`sidebar-subnav-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={depth ? 16 : 18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <NavLink
                to={destination}
                end={!hasChildren}
                onClick={() => handleNavigationClick(key, hasChildren)}
                className={() => `${depth ? 'sidebar-subnav-item' : 'nav-item'}${active ? ' active' : ''}`}
              >
                <Icon size={depth ? 16 : 18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
          {hasChildren && (
            <button
              type="button"
              className={`sidebar-submenu-toggle${expanded ? ' open' : ''}`}
              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label} menu`}
              aria-expanded={expanded}
              aria-controls={submenuId}
              onClick={() => toggleGroup(key)}
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {hasChildren && expanded && (
          <div className="sidebar-subnav" id={submenuId}>
            {children.map((child) => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {sidebarOpen && <div className="backdrop" onClick={closeSidebar} aria-hidden="true" />}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">HS</div>
          <div>
            <h2>Housing Society</h2>
            <h6>Management Platform</h6>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {orderedItems.map((item) => renderNavigationItem(item))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-button" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
