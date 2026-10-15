import { NavLink } from 'react-router-dom';
import { Building2, Car, ChartNoAxesCombined, CheckCircle, ClipboardList, FileText, FolderArchive, Gauge, Home, Layers3, LayoutDashboard, LifeBuoy, LogOut, MessageSquare, Network, Package, ParkingSquare, Shield, ShieldCheck, Truck, Users, Wallet, CalendarDays } from 'lucide-react';
import useAuth from '../../app/providers/useAuth';
import { useUi } from '../../app/store/ui.store';

/**
 * The menu is driven by PERMISSIONS, not role names. An item with a
 * `permission` only appears if the logged-in user holds it (Super Admin
 * holds everything). An item without one is shown to every signed-in user.
 *
 * Add each module's entry to NAV_ITEMS when that module's frontend is built
 * (give it a lucide-react `icon`). `permission` can also be an array - the
 * item shows if the user has ANY of them.
 */
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Society Overview', to: '/housing-dashboard', icon: Building2 },
  { label: 'Societies', to: '/societies', icon: Building2 },
  { label: 'Towers', to: '/towers', icon: Layers3 },
  { label: 'Floors', to: '/floors', icon: Layers3 },
  { label: 'Units', to: '/units', icon: Home },
  { label: 'Residents', to: '/residents', icon: Users },
  { label: 'Move-in / Move-out', to: '/move-in-out', icon: ClipboardList },
  { label: 'Finance', to: '/finance', icon: Wallet },
  { label: 'Users', to: '/users', permission: 'USER_READ', icon: Users },
  { label: 'Roles', to: '/roles', permission: 'ROLE_READ', icon: ShieldCheck },
  {
    label: 'Parking',
    to: '/parking',
    permission: ['PARKING_AREA_READ', 'PARKING_SLOT_READ', 'PARKING_ALLOCATION_READ'],
    icon: ParkingSquare,
  },
  { label: 'Vehicles', to: '/vehicles', permission: 'VEHICLE_READ', icon: Car },
  { label: 'Vendors', to: '/vendors', permission: 'VENDOR_READ', icon: Truck },
  { label: 'Procurement', to: '/procurement', permission: 'PURCHASE_REQUEST_READ', icon: ClipboardList },
  { label: 'Purchase Orders', to: '/purchase-orders', permission: 'PURCHASE_ORDER_READ', icon: FileText },
  { label: 'Approvals', to: '/approvals', permission: 'APPROVAL_READ', icon: CheckCircle },
  { label: 'Security', to: '/security', permission: ['GATE_READ', 'VISITOR_PROFILE_READ', 'DELIVERY_READ'], icon: Shield },
  { label: 'Security Operations', to: '/security-operations', icon: Shield },
  { label: 'Assets', to: '/assets', icon: Package },
  { label: 'Notifications', to: '/notifications', icon: CalendarDays },
  { label: 'Community', to: '/community', icon: MessageSquare },
  { label: 'Reports', to: '/reports', icon: ChartNoAxesCombined },
  { label: 'Multi-society', to: '/multi-society', icon: Network },
  { label: 'Amenities', to: '/amenities', permission: ['AMENITY_READ', 'AMENITY_SLOT_READ', 'AMENITY_BOOKING_READ'], icon: CalendarDays },
  { label: 'Helpdesk', to: '/helpdesk/tickets', permission: 'TICKET_READ', icon: LifeBuoy },
  { label: 'Document Vault', to: '/document-vault', permission: ['DOCUMENT_FOLDER_READ', 'DOCUMENT_READ'], icon: FolderArchive },
   { label: 'Utility & Meters', to: '/utilities', permission: ['UTILITY_TYPE_READ', 'METER_READ', 'METER_READING_READ', 'UTILITY_TARIFF_READ', 'UTILITY_BILL_READ'], icon: Gauge },
   { label: 'Reports Center', to: '/reports-center', permission: ['REPORT_DASHBOARD_READ', 'REPORT_OPERATIONS_READ', 'REPORT_SECURITY_READ', 'REPORT_HELPDESK_READ', 'REPORT_VENDOR_READ', 'REPORT_PROCUREMENT_READ', 'REPORT_AMENITY_READ', 'REPORT_UTILITY_READ'], icon: ChartNoAxesCombined },
];

export default function Sidebar() {
  const { hasAnyPermission, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useUi();

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasAnyPermission(item.permission));

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
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
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
