import {
    LayoutDashboard,
    Building2,
    Network,
    Layers3,
    Users,
    UserRound,
    Home,
    Wallet,
    Shield,
    Package,
    Headphones,
    Bell,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    ChevronDown,
    ClipboardCheck,
    KeyRound,
    ArrowDownLeft,
    ArrowUpRight,
    FileText,
    BookOpen,
    ReceiptText,
    CalendarDays,
    ClipboardList, MapPinned, Siren, UserCog, Wrench, Megaphone, SlidersHorizontal
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { useAuth } from "../../app/providers/useAuth";

const Sidebar = ({ isOpen = false, onNavigate }) => {
    const { logout } = useAuth();
    const location = useLocation();

    const societyPaths = ["/societies", "/towers", "/floors", "/units"];
    const residentPaths = [
        "/residents",
        "/residents/list",
        "/residents/ownership",
        "/residents/verification",
        "/residents/non-members"
    ];
    const moveInOutPaths = [
        "/move-in-out",
        "/move-in-out/move-ins",
        "/move-in-out/move-outs",
        "/move-in-out/agreements",
        "/move-in-out/renewals"
    ];
    const financePaths = [
        "/finance",
        "/finance/dashboard",
        "/finance/accounts",
        "/finance/journals",
        "/finance/payments",
        "/finance/ledgers",
        "/finance/billing",
        "/finance/invoices",
        "/finance/reports",
        "/finance/reconciliation",
        "/finance/taxes",
        "/finance/exports",
        "/finance/periods"
    ];
    const securityPaths = ["/security", "/security/staff", "/security/attendance", "/security/rosters", "/security/tasks", "/security/patrols", "/security/incidents", "/security/emergencies", "/security/audit"];
    const assetPaths = ["/assets", ...["overview", "assets", "inventory", "maintenance", "contracts", "schedules", "documents", "reminders", "categories"].map((section) => `/assets/${section}`)];
    const notificationPaths = ["/notifications", ...["overview", "notifications", "templates", "preferences", "broadcasts", "reports"].map((section) => `/notifications/${section}`)];
    const communityPaths = ["/community", ...["groups", "forums", "classifieds", "events", "meetings", "governance", "moderation", "voting"].map((section) => `/community/${section}`)];
    const multiSocietyPaths = ["/multi-society", ...["organizations", "clusters", "mapping", "access", "reports"].map((section) => `/multi-society/${section}`)];

    const isSocietyRoute = societyPaths.includes(location.pathname);
    const isResidentRoute = residentPaths.includes(location.pathname);
    const isMoveInOutRoute = moveInOutPaths.includes(location.pathname);
    const isFinanceRoute = financePaths.includes(location.pathname);
    const isSecurityRoute = securityPaths.includes(location.pathname);
    const isAssetsRoute = assetPaths.includes(location.pathname);
    const isNotificationsRoute = notificationPaths.includes(location.pathname);
    const isCommunityRoute = communityPaths.includes(location.pathname);
    const isMultiSocietyRoute = multiSocietyPaths.includes(location.pathname);

    const [societyMenuOpen, setSocietyMenuOpen] = useState(isSocietyRoute);
    const [residentMenuOpen, setResidentMenuOpen] = useState(isResidentRoute);
    const [moveInOutMenuOpen, setMoveInOutMenuOpen] = useState(isMoveInOutRoute);
    const [financeMenuOpen, setFinanceMenuOpen] = useState(isFinanceRoute);
    const [securityMenuOpen, setSecurityMenuOpen] = useState(isSecurityRoute);
    const [assetsMenuOpen, setAssetsMenuOpen] = useState(isAssetsRoute);
    const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(isNotificationsRoute);
    const [communityMenuOpen, setCommunityMenuOpen] = useState(isCommunityRoute);
    const [multiSocietyMenuOpen, setMultiSocietyMenuOpen] = useState(isMultiSocietyRoute);

    useEffect(() => {
        setSocietyMenuOpen(societyPaths.includes(location.pathname));
        setResidentMenuOpen(residentPaths.includes(location.pathname));
        setMoveInOutMenuOpen(moveInOutPaths.includes(location.pathname));
        setFinanceMenuOpen(financePaths.includes(location.pathname));
        setSecurityMenuOpen(securityPaths.includes(location.pathname));
        setAssetsMenuOpen(assetPaths.includes(location.pathname));
        setNotificationsMenuOpen(notificationPaths.includes(location.pathname));
        setCommunityMenuOpen(communityPaths.includes(location.pathname));
        setMultiSocietyMenuOpen(multiSocietyPaths.includes(location.pathname));
    }, [location.pathname]);

    const menuItems = [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        {
            label: "Societies",
            path: "/societies",
            icon: Building2,
            children: [
                { label: "Towers", path: "/towers", icon: Building2 },
                { label: "Floors", path: "/floors", icon: Layers3 },
                { label: "Units", path: "/units", icon: Home }
            ]
        },
        {
            label: "Residents",
            path: "/residents",
            icon: Users,
            children: [
                { label: "Ownership", path: "/residents/ownership", icon: KeyRound },
                { label: "Verification", path: "/residents/verification", icon: ClipboardCheck },
                { label: "Non-Members", path: "/residents/non-members", icon: UserRound }
            ]
        },
        {
            label: "Move-In / Move-Out",
            path: "/move-in-out",
            icon: ArrowDownLeft,
            children: [
                { label: "Move-ins", path: "/move-in-out/move-ins", icon: ArrowDownLeft },
                { label: "Move-outs", path: "/move-in-out/move-outs", icon: ArrowUpRight },
                { label: "Agreements", path: "/move-in-out/agreements", icon: FileText },
                { label: "Reminders", path: "/move-in-out/renewals", icon: Bell }
            ]
        },
        {
            label: "Finance",
            path: "/finance",
            icon: Wallet,
            children: [
                // { label: "Dashboard", path: "/finance/dashboard", icon: LayoutDashboard },
                { label: "Accounts", path: "/finance/accounts", icon: BookOpen },
                { label: "Journals", path: "/finance/journals", icon: FileText },
                { label: "Payments", path: "/finance/payments", icon: Wallet },
                { label: "Ledger", path: "/finance/ledgers", icon: ClipboardCheck },
                { label: "Billing", path: "/finance/billing", icon: ReceiptText },
                { label: "Invoices", path: "/finance/invoices", icon: FileText },
                // { label: "Reports", path: "/finance/reports", icon: BarChart3 },
                // { label: "Reconciliation", path: "/finance/reconciliation", icon: ArrowDownLeft },
                { label: "Taxes", path: "/finance/taxes", icon: ArrowUpRight },
                { label: "Exports", path: "/finance/exports", icon: Bell },
                //{ label: "Periods", path: "/finance/periods", icon: CalendarDays }
            ]
        },
        { label: "Security", path: "/security", icon: Shield, children: [
            { label: "Staff & documents", path: "/security/staff", icon: UserCog },
            { label: "Attendance", path: "/security/attendance", icon: ClipboardCheck },
            { label: "Shifts & rosters", path: "/security/rosters", icon: CalendarDays },
            { label: "Tasks", path: "/security/tasks", icon: ClipboardList },
            { label: "Patrols", path: "/security/patrols", icon: MapPinned },
            { label: "Incidents", path: "/security/incidents", icon: Shield },
            { label: "Emergencies", path: "/security/emergencies", icon: Siren },
            { label: "Audit trail", path: "/security/audit", icon: FileText }
        ] },
        { label: "Assets", path: "/assets", icon: Package, children: [
            // { label: "Overview", path: "/assets/overview", icon: LayoutDashboard },
            { label: "Asset register", path: "/assets/assets", icon: Package },
            { label: "Inventory", path: "/assets/inventory", icon: ClipboardList },
            { label: "Maintenance", path: "/assets/maintenance", icon: CalendarDays },
            { label: "AMCs & vendors", path: "/assets/contracts", icon: Shield },
            { label: "Schedules & work orders", path: "/assets/schedules", icon: Wrench },
            { label: "Documents & QR", path: "/assets/documents", icon: FileText },
            { label: "Lifecycle & reminders", path: "/assets/reminders", icon: Bell },
            { label: "Categories", path: "/assets/categories", icon: Layers3 }
        ] },
        
        { label: "Notifications", path: "/notifications", icon: Bell, children: [
            // { label: "Overview", path: "/notifications/overview", icon: LayoutDashboard },
            { label: "Notification queue", path: "/notifications/notifications", icon: Bell },
            { label: "Templates", path: "/notifications/templates", icon: FileText },
            { label: "Preferences", path: "/notifications/preferences", icon: SlidersHorizontal },
            { label: "Broadcasts", path: "/notifications/broadcasts", icon: Megaphone },
            { label: "Delivery reports", path: "/notifications/reports", icon: ClipboardCheck }
        ] },
        { label: "Community", path: "/community", icon: MessageSquare, children: [
            // { label: "Overview", path: "/community", icon: LayoutDashboard },
            { label: "Groups & members", path: "/community/groups", icon: Users },
            { label: "Forums", path: "/community/forums", icon: MessageSquare },
            { label: "Classifieds", path: "/community/classifieds", icon: Package },
            { label: "Events", path: "/community/events", icon: CalendarDays },
            { label: "Meetings", path: "/community/meetings", icon: ClipboardList },
            { label: "AGM / SGM", path: "/community/governance", icon: FileText },
            { label: "Moderation", path: "/community/moderation", icon: Shield },
            { label: "Voting & rules", path: "/community/voting", icon: ClipboardCheck }
        ] },
        { label: "Reports", path: "/reports", icon: BarChart3 },
        { label: "Multi-society", path: "/multi-society", icon: Network, children: [
            // { label: "Overview", path: "/multi-society", icon: LayoutDashboard },
            { label: "Organizations", path: "/multi-society/organizations", icon: Building2 },
            { label: "Clusters", path: "/multi-society/clusters", icon: Layers3 },
            { label: "Society mapping", path: "/multi-society/mapping", icon: Network },
            { label: "User access", path: "/multi-society/access", icon: Shield },
            { label: "Dashboards & reports", path: "/multi-society/reports", icon: BarChart3 }
        ] },
        { label: "Settings", path: "/settings", icon: Settings }
    ];

    return (
        <aside className={`sidebar${isOpen ? " open" : ""}`}>
            <div className="sidebar-logo">
                <div className="logo-mark">HS</div>
                <div>
                    <h2>Housing Society</h2>
                    <h6>Management Platform</h6>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    if (item.children) {
                        const isThisResidentMenu = item.label === "Residents";
                        const isThisMoveInOutMenu = item.label === "Move-In / Move-Out";
                        const isThisFinanceMenu = item.label === "Finance";
                        const isThisSecurityMenu = item.label === "Security";
                        const isThisAssetsMenu = item.label === "Assets";
                        const isThisNotificationsMenu = item.label === "Notifications";
                        const isThisCommunityMenu = item.label === "Community";
                        const isThisMultiSocietyMenu = item.label === "Multi-society";
                        const isMenuOpen = isThisResidentMenu
                            ? residentMenuOpen
                            : isThisMoveInOutMenu
                                ? moveInOutMenuOpen
                                : isThisFinanceMenu
                                    ? financeMenuOpen
                                : isThisSecurityMenu
                                    ? securityMenuOpen
                                    : isThisAssetsMenu
                                        ? assetsMenuOpen
                                        : isThisNotificationsMenu
                                            ? notificationsMenuOpen
                                    : isThisCommunityMenu
                                        ? communityMenuOpen
                                    : isThisMultiSocietyMenu
                                        ? multiSocietyMenuOpen
                                        : societyMenuOpen;

                        return (
                            <div className="sidebar-nav-group" key={item.path}>
                                <div className="sidebar-nav-group-heading">
                                    <NavLink
                                        to={item.path}
                                        end
                                        className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                                        onClick={() => {
                                            if (isThisResidentMenu) setResidentMenuOpen(true);
                                            else if (isThisMoveInOutMenu) setMoveInOutMenuOpen(true);
                                            else if (isThisFinanceMenu) setFinanceMenuOpen(true);
                                            else if (isThisSecurityMenu) setSecurityMenuOpen(true);
                                            else if (isThisAssetsMenu) setAssetsMenuOpen(true);
                                            else if (isThisNotificationsMenu) setNotificationsMenuOpen(true);
                                            else if (isThisCommunityMenu) setCommunityMenuOpen(true);
                                            else if (isThisMultiSocietyMenu) setMultiSocietyMenuOpen(true);
                                            else setSocietyMenuOpen(true);
                                            onNavigate?.();
                                        }}
                                    >
                                        <Icon size={19} />
                                        <span>{item.label}</span>
                                    </NavLink>

                                    <button
                                        type="button"
                                        className={`sidebar-submenu-toggle${isMenuOpen ? " open" : ""}`}
                                        aria-label={isMenuOpen ? `Collapse ${item.label.toLowerCase()} menu` : `Expand ${item.label.toLowerCase()} menu`}
                                        aria-expanded={isMenuOpen}
                                        onClick={() => {
                                            if (isThisResidentMenu) setResidentMenuOpen((open) => !open);
                                            else if (isThisMoveInOutMenu) setMoveInOutMenuOpen((open) => !open);
                                            else if (isThisFinanceMenu) setFinanceMenuOpen((open) => !open);
                                            else if (isThisSecurityMenu) setSecurityMenuOpen((open) => !open);
                                            else if (isThisAssetsMenu) setAssetsMenuOpen((open) => !open);
                                            else if (isThisNotificationsMenu) setNotificationsMenuOpen((open) => !open);
                                            else if (isThisCommunityMenu) setCommunityMenuOpen((open) => !open);
                                            else if (isThisMultiSocietyMenu) setMultiSocietyMenuOpen((open) => !open);
                                            else setSocietyMenuOpen((open) => !open);
                                        }}
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </div>

                                {isMenuOpen && (
                                    <div className="sidebar-subnav">
                                        {item.children.map((child) => {
                                            const ChildIcon = child.icon;
                                            return (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    className={({ isActive }) => `sidebar-subnav-item${isActive ? " active" : ""}`}
                                                    onClick={() => {
                                                        if (isThisResidentMenu) setResidentMenuOpen(true);
                                                        else if (isThisMoveInOutMenu) setMoveInOutMenuOpen(true);
                                                        else if (isThisFinanceMenu) setFinanceMenuOpen(true);
                                                        else if (isThisSecurityMenu) setSecurityMenuOpen(true);
                                                        else if (isThisAssetsMenu) setAssetsMenuOpen(true);
                                                        else if (isThisNotificationsMenu) setNotificationsMenuOpen(true);
                                                        else if (isThisCommunityMenu) setCommunityMenuOpen(true);
                                                        else if (isThisMultiSocietyMenu) setMultiSocietyMenuOpen(true);
                                                        else setSocietyMenuOpen(true);
                                                        onNavigate?.();
                                                    }}
                                                >
                                                    <ChildIcon size={16} />
                                                    <span>{child.label}</span>
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
                            onClick={() => {
                                setSocietyMenuOpen(false);
                                setResidentMenuOpen(false);
                                setMoveInOutMenuOpen(false);
                                setFinanceMenuOpen(false);
                                onNavigate?.();
                            }}
                        >
                            <Icon size={19} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-button" onClick={logout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;


