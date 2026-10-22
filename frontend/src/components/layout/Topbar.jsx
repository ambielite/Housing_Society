import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Car,Layers3, Boxes, ChevronDown, ClipboardList, FileText, Home, Menu, Moon, Plus, Shield, Sun, Truck, Users, UserRoundPlus, X } from 'lucide-react';
import useAuth from '../../app/providers/useAuth';
import useTheme from '../../app/providers/useTheme';
import useSociety from '../../app/store/useSociety';
import { useUi } from '../../app/store/ui.store';
import api, { societyStorage } from '../../lib/axios';

const QUICK_CREATE_GROUPS = [
  {
    label: 'People',
    actions: [
      { label: 'User', description: 'Create a sign-in account', to: '/users/new', permission: 'USER_CREATE', icon: UserRoundPlus },
      { label: 'Resident', description: 'Add a society resident', to: '/residents?new=1', permission: 'RESIDENT_CREATE', icon: Users },
    ],
  },
  {
    label: 'Property',
    actions: [
      { label: 'Tower', description: 'Register a property tower', to: '/towers?new=1', permission: 'TOWER_CREATE', icon: Layers3 },
      { label: 'Floor', description: 'Register a property floor', to: '/floors?new=1', permission: 'FLOOR_CREATE', icon: Boxes },
      { label: 'Unit', description: 'Register a property unit', to: '/units?new=1', permission: 'UNIT_CREATE', icon: Home },
    ],
  },
  {
    label: 'Operations',
    actions: [
      { label: 'Vehicle', description: 'Register a society vehicle', to: '/vehicles/new', permission: 'VEHICLE_CREATE', icon: Car },
      { label: 'Vendor', description: 'Add a service provider', to: '/vendors/new', permission: 'VENDOR_CREATE', icon: Truck },
      { label: 'Purchase request', description: 'Start a procurement request', to: '/procurement/requests/new', permission: 'PURCHASE_REQUEST_CREATE', icon: ClipboardList },
      { label: 'Role', description: 'Create an access role', to: '/roles/new', permission: 'ROLE_CREATE', icon: Shield },
    ],
  },
];

export const roleLabel = (code) =>
  code
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function Topbar() {
  const { user, roles, logout, logoutAll, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useUi();
  const { societyId, setSocietyId } = useSociety();
  const [societies, setSocieties] = useState([]);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const menuRef = useRef(null);
  const quickAddRef = useRef(null);
  const societyRequest = useRef(0);
  const userId = user?.id;

  const refreshSocieties = useCallback(async () => {
    if (!userId) return;
    const requestId = ++societyRequest.current;
    try {
      const { data } = await api.get('/users/me/societies', { skipSociety: true });
      if (requestId !== societyRequest.current) return;
      const available = Array.isArray(data?.data) ? data.data : [];
      setSocieties(available);
      if (available.length && !available.some((society) => String(society.id) === String(societyId))) {
        setSocietyId(available[0].id);
      } else if (societyId && String(societyStorage.get()) !== String(societyId)) {
        // Legacy Nikhil APIs still read the shared active-society storage key.
        setSocietyId(societyId);
      }
    } catch {
      if (requestId === societyRequest.current) setSocieties([]);
    }
  }, [userId, societyId, setSocietyId]);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) setQuickAddOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setQuickAddOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const availableQuickCreateGroups = QUICK_CREATE_GROUPS
    .map((group) => ({ ...group, actions: group.actions.filter((action) => hasPermission(action.permission)) }))
    .filter((group) => group.actions.length > 0);

  useEffect(() => {
    void refreshSocieties();
    window.addEventListener('housing:societies-updated', refreshSocieties);
    return () => window.removeEventListener('housing:societies-updated', refreshSocieties);
  }, [refreshSocieties]);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email;
  const initial = (user?.first_name || user?.email || '?').charAt(0).toUpperCase();
  const profilePicture = user?.profile_picture_url;
  const avatarImageUrl = profilePicture
    ? (/^https?:\/\//i.test(profilePicture)
      ? profilePicture
      : new URL(
        profilePicture,
        new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1', window.location.origin),
      ).toString())
    : '';

  useEffect(() => setAvatarImageFailed(false), [avatarImageUrl]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="mobile-menu-button" onClick={toggleSidebar} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        {availableQuickCreateGroups.length > 0 && (
          <div className="quick-add-wrap" ref={quickAddRef}>
            <button
              type="button"
              className="quick-add-trigger"
              onClick={() => setQuickAddOpen((open) => !open)}
              aria-expanded={quickAddOpen}
              aria-haspopup="dialog"
            >
              <Plus size={17} />
              <span>Add New</span>
              <ChevronDown size={15} className={quickAddOpen ? 'quick-add-chevron is-open' : 'quick-add-chevron'} />
            </button>
            {quickAddOpen && (
              <section className="quick-add-panel" role="dialog" aria-label="Quick create">
                <header className="quick-add-heading">
                  <div>
                    <span className="quick-add-eyebrow">QUICK CREATE</span>
                    <h2>Add something new</h2>
                    <p>Choose what you want to add to your society.</p>
                  </div>
                  <button type="button" className="quick-add-close" onClick={() => setQuickAddOpen(false)} aria-label="Close quick create">
                    <X size={17} />
                  </button>
                </header>
                <div className="quick-add-content">
                  {availableQuickCreateGroups.map((group) => (
                    <div className="quick-add-group" key={group.label}>
                      <h3>{group.label}</h3>
                      <div className="quick-add-grid">
                        {group.actions.map(({ label, description, to, icon: Icon }) => (
                          <Link className="quick-add-item" key={label} to={to} onClick={() => setQuickAddOpen(false)}>
                            <span className="quick-add-icon"><Icon size={18} /></span>
                            <span className="quick-add-item-copy"><strong>{label}</strong><small>{description}</small></span>
                            <span className="quick-add-item-arrow" aria-hidden="true">↗</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <footer className="quick-add-footer"><FileText size={14} /> Options depend on your access permissions.</footer>
              </section>
            )}
          </div>
        )}
        {user && societies.length > 0 && (
          <label className="current-society">
            <span className="topbar-label">Active society</span>
            <select
              className="society-topbar-select"
              aria-label="Select active society"
              value={societyId || ''}
              onChange={(event) => {
                if (event.target.value === societyId) return;
                setSocietyId(event.target.value);
                window.location.reload();
              }}
            >
              {societies.map((society) => (
                <option key={society.id} value={society.id}>{society.name}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button type="button" className="notification-button" aria-label="Notifications" title="Notifications (coming soon)">
          <Bell size={18} />
        </button>

        <div className="user-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="user-menu"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="avatar">
              {avatarImageUrl && !avatarImageFailed
                ? <img src={avatarImageUrl} alt="" onError={() => setAvatarImageFailed(true)} />
                : initial}
            </span>
            <span className="user-info">
              <strong>{fullName}</strong>
              <span>{roles.map(roleLabel).join(', ') || 'No role assigned'}</span>
            </span>
            <ChevronDown size={16} />
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <Link to="/change-password" role="menuitem" onClick={() => setMenuOpen(false)}>
                Change password
              </Link>
              <button type="button" role="menuitem" onClick={logout}>
                Sign out
              </button>
              <button type="button" role="menuitem" onClick={logoutAll}>
                Sign out on all devices
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
