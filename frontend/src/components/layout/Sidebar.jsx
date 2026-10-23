import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Archive, Bell, Boxes, Building2, CalendarClock, CalendarDays, Car,
  ChartNoAxesCombined, CheckCircle, ChevronDown, ClipboardCheck, ClipboardList,
  FileCheck2, FileText, FolderArchive, Gauge, Home, KeyRound, Layers3,
  LayoutDashboard, LifeBuoy, LogOut, Megaphone, MessageSquare, Network,
  Package, ParkingSquare, Settings2, Shield, ShieldCheck, Siren, Tag, Truck,
  Users, Wallet,
} from 'lucide-react';
import useAuth from '../../app/providers/useAuth';
import { useUi } from '../../app/store/ui.store';

// Navigation points only to routes already registered in app/router. Each
// destination page continues to load its data through its existing API module.
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Home', to: '/housing-dashboard', permission: ['SOCIETY_READ', 'RESIDENT_READ', 'ASSET_READ', 'ACCOUNT_READ'], icon: Building2 },
  {
    label: 'Societies', to: '/societies', permission: 'SOCIETY_READ', icon: Building2,
    children: [
      { label: 'Towers', to: '/towers', permission: 'TOWER_READ', icon: Layers3 },
      { label: 'Floors', to: '/floors', permission: 'FLOOR_READ', icon: Boxes },
      { label: 'Units', to: '/units', permission: 'UNIT_READ', icon: Home },
    ],
  },
  {
    label: 'Residents', to: '/residents', permission: 'RESIDENT_READ', icon: Users,
    children: [
      { label: 'Ownership', to: '/residents/ownership', permission: 'OWNER_UNIT_READ', icon: KeyRound },
      { label: 'Verification', to: '/residents/verification', permission: 'RESIDENT_VERIFICATION_READ', icon: ClipboardCheck },
      { label: 'Non-members', to: '/residents/non-members', permission: 'NON_MEMBER_READ', icon: Building2 },
    ],
  },
  {
    label: 'Move-in / Move-out', to: '/move-in-out', permission: ['MOVE_IN_READ', 'MOVE_OUT_READ'], icon: ClipboardList,
    children: [
      { label: 'Move-ins', to: '/move-in-out/move-ins', permission: 'MOVE_IN_READ', icon: ClipboardCheck },
      { label: 'Move-outs', to: '/move-in-out/move-outs', permission: 'MOVE_OUT_READ', icon: CalendarDays },
      { label: 'Agreements', to: '/move-in-out/agreements', permission: 'AGREEMENT_READ', icon: FileText },
      { label: 'Reminders', to: '/move-in-out/renewals', permission: ['AGREEMENT_RENEWAL_READ', 'AGREEMENT_REMINDER_READ'], icon: Bell },
    ],
  },
  {
    label: 'Finance', to: '/finance', permission: ['ACCOUNT_READ', 'BILLING_READ', 'INVOICE_READ', 'PAYMENT_READ', 'FINANCIAL_REPORT_READ'], icon: Wallet,
    children: [
      { label: 'Periods', to: '/finance/periods', permission: 'ACCOUNTING_PERIOD_READ', icon: CalendarDays },
      { label: 'Accounts', to: '/finance/accounts', permission: 'ACCOUNT_READ', icon: LayoutDashboard },
      { label: 'Billing', to: '/finance/billing', permission: 'BILLING_READ', icon: FileCheck2 },
      { label: 'Taxes', to: '/finance/taxes', permission: 'TAX_READ', icon: ChartNoAxesCombined },
      { label: 'Invoices', to: '/finance/invoices', permission: 'INVOICE_READ', icon: FileText },
      { label: 'Payments', to: '/finance/payments', permission: 'PAYMENT_READ', icon: Wallet },
      { label: 'Journals', to: '/finance/journals', permission: 'JOURNAL_READ', icon: FileText },
      { label: 'Ledgers', to: '/finance/ledgers', permission: ['LEDGER_ACCOUNT_READ', 'GENERAL_LEDGER_READ'], icon: Archive },
      
    ],
  },
  { label: 'Users', to: '/users', permission: 'USER_READ', icon: Users },
  { label: 'Roles', to: '/roles', permission: 'ROLE_READ', icon: ShieldCheck },
  {
    label: 'Parking', to: '/parking',
    permission: ['PARKING_AREA_READ', 'PARKING_SLOT_READ', 'PARKING_ALLOCATION_READ'], icon: ParkingSquare,
  },
  { label: 'Vehicles', to: '/vehicles', permission: 'VEHICLE_READ', icon: Car },
  { label: 'Vendors', to: '/vendors', permission: 'VENDOR_READ', icon: Truck },
  { label: 'Procurement', to: '/procurement', permission: 'PURCHASE_REQUEST_READ', icon: ClipboardList },
  { label: 'Purchase Orders', to: '/purchase-orders', permission: 'PURCHASE_ORDER_READ', icon: FileText },
  { label: 'Approvals', to: '/approvals', permission: 'APPROVAL_READ', icon: CheckCircle },
  {
    label: 'Security', to: '/security-operations', icon: Shield,
    children: [
      { label: 'Staff & documents', to: '/security-operations/staff', permission: 'STAFF_READ', icon: Users },
      { label: 'Attendance', to: '/security-operations/attendance', permission: 'STAFF_ATTENDANCE_READ', icon: ClipboardCheck },
      { label: 'Shifts & rosters', to: '/security-operations/rosters', permission: ['SHIFT_READ', 'ROSTER_READ'], icon: CalendarDays },
      { label: 'Tasks', to: '/security-operations/tasks', permission: 'STAFF_TASK_READ', icon: CheckCircle },
      { label: 'Patrols', to: '/security-operations/patrols', permission: 'PATROL_READ', icon: ShieldCheck },
      { label: 'Incidents', to: '/security-operations/incidents', permission: 'INCIDENT_READ', icon: Siren },
      { label: 'Emergencies', to: '/security-operations/emergencies', permission: 'EMERGENCY_READ', icon: Siren },
      
      {
        label: 'Gates & visitor access', to: '/security', icon: Shield,
        permission: ['GATE_READ', 'VISITOR_PROFILE_READ', 'DELIVERY_READ'],
      },
    ],
  },
  {
    label: 'Assets', to: '/assets', permission: ['ASSET_READ', 'INVENTORY_READ', 'ASSET_MAINTENANCE_READ'], icon: Package,
    children: [
      { label: 'Asset register', to: '/assets/assets', permission: 'ASSET_READ', icon: Package },
      { label: 'Inventory', to: '/assets/inventory', permission: 'INVENTORY_READ', icon: Boxes },
      { label: 'Maintenance', to: '/assets/maintenance', permission: 'ASSET_MAINTENANCE_READ', icon: Settings2 },
      { label: 'AMCs & vendors', to: '/assets/contracts', permission: 'AMC_READ', icon: ShieldCheck },
      { label: 'Schedules & work orders', to: '/assets/schedules', permission: ['MAINTENANCE_SCHEDULE_READ', 'WORK_ORDER_READ'], icon: CalendarClock },
      { label: 'Documents & QR', to: '/assets/documents', permission: ['ASSET_DOCUMENT_READ', 'ASSET_QR_READ'], icon: FileText },
      { label: 'Lifecycle & reminders', to: '/assets/reminders', permission: 'ASSET_LIFECYCLE_READ', icon: Bell },
      { label: 'Categories', to: '/assets/categories', permission: 'ASSET_CATEGORY_READ', icon: Tag },
    ],
  },
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
  { label: 'Reports', to: '/reports', permission: ['REPORT_DASHBOARD_READ', 'REPORT_FINANCE_READ', 'REPORT_OPERATIONS_READ', 'REPORT_SECURITY_READ', 'REPORT_APPROVAL_READ', 'REPORT_HELPDESK_READ', 'REPORT_VENDOR_READ', 'REPORT_PROCUREMENT_READ', 'REPORT_AMENITY_READ', 'REPORT_UTILITY_READ'], icon: ChartNoAxesCombined },
  { label: 'Multi-society', to: '/multi-society', permission: ['ORGANIZATION_READ', 'CLUSTER_READ', 'MULTI_SOCIETY_READ'], icon: Network },
  { label: 'Amenities', to: '/amenities', permission: ['AMENITY_READ', 'AMENITY_SLOT_READ', 'AMENITY_BOOKING_READ'], icon: CalendarDays },
  { label: 'Helpdesk', to: '/helpdesk/tickets', permission: 'TICKET_READ', icon: LifeBuoy },
  { label: 'Document Vault', to: '/document-vault', icon: FolderArchive },
  { label: 'Utility & Meters', to: '/utilities', permission: ['UTILITY_TYPE_READ', 'METER_READ', 'METER_READING_READ', 'UTILITY_TARIFF_READ', 'UTILITY_BILL_READ'], icon: Gauge },
];

const canSee = (item, hasAnyPermission) => !item.permission || hasAnyPermission(item.permission);
const matchesPath = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

export default function Sidebar() {
  const { hasAnyPermission, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useUi();
  const { pathname } = useLocation();
  const [openGroup, setOpenGroup] = useState(null);

  const visibleItems = NAV_ITEMS
    .map((item) => ({ ...item, children: item.children?.filter((child) => canSee(child, hasAnyPermission)) }))
    .filter((item) => canSee(item, hasAnyPermission) || item.children?.length);
  const societyOverview = visibleItems.find((item) => item.to === '/housing-dashboard');
  const orderedItems = [
    ...(societyOverview ? [societyOverview] : []),
    ...visibleItems.filter((item) => item !== societyOverview && item.children?.length),
    ...visibleItems.filter((item) => item !== societyOverview && !item.children?.length),
  ];

  useEffect(() => {
    const activeGroup = NAV_ITEMS.find((item) =>
      item.children && (
        matchesPath(pathname, item.to) || item.children.some((child) => matchesPath(pathname, child.to))
      )
    );
    setOpenGroup(activeGroup?.to || null);
  }, [pathname]);

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
          {orderedItems.map((item) => {
            const Icon = item.icon;
            const children = item.children || [];
            const hasChildren = children.length > 0;
            const destination = canSee(item, hasAnyPermission) ? item.to : children[0]?.to || item.to;
            const expanded = openGroup === item.to;
            const active = matchesPath(pathname, destination) || children.some((child) => matchesPath(pathname, child.to));

            return (
              <div className="sidebar-nav-group" key={item.to}>
                <div className="sidebar-nav-group-heading">
                  <NavLink
                    to={destination}
                    end
                    onClick={closeSidebar}
                    className={`nav-item${active ? ' active' : ''}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                  {hasChildren && (
                    <button
                      type="button"
                      className={`sidebar-submenu-toggle${expanded ? ' open' : ''}`}
                      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label} menu`}
                      aria-expanded={expanded}
                      aria-controls={`sidebar-submenu-${item.to.slice(1).replaceAll('/', '-')}`}
                      onClick={() => setOpenGroup(expanded ? null : item.to)}
                    >
                      <ChevronDown size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {hasChildren && expanded && (
                  <div
                    className="sidebar-subnav"
                    id={`sidebar-submenu-${item.to.slice(1).replaceAll('/', '-')}`}
                  >
                    {children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end
                          onClick={closeSidebar}
                          className={({ isActive }) => `sidebar-subnav-item${isActive ? ' active' : ''}`}
                        >
                          <ChildIcon size={16} aria-hidden="true" />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
