import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Car, Layers3, Boxes, ChevronDown, ClipboardList, FileText, Home, Mail, MapPin, Menu, Moon, Phone, Plus, QrCode, Shield, Sun, Truck, Users, UserRoundPlus, X, KeyRound, LogOut, Building2, ArrowUpRight } from 'lucide-react';
import useAuth from '../../app/providers/useAuth';
import useTheme from '../../app/providers/useTheme';
import useSociety from '../../app/store/useSociety';
import { useUi } from '../../app/store/ui.store';
import api, { societyStorage } from '../../lib/axios';
import societyApi from '../../features/societies/api/society.api';

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSociety, setProfileSociety] = useState(null);
  const [societyLoading, setSocietyLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
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
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) setQuickAddOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setQuickAddOpen(false);
        setProfileOpen(false);
      }
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

  useEffect(() => {
    if (!profileOpen || !societyId) return undefined;
    let active = true;
    setProfileSociety(null);
    setSocietyLoading(true);
    societyApi.getById(societyId)
      .then((response) => {
        if (!active) return;
        setProfileSociety(response?.data?.society || response?.data || response?.society || response || null);
      })
      .catch(() => { if (active) setProfileSociety(null); })
      .finally(() => { if (active) setSocietyLoading(false); });
    return () => { active = false; };
  }, [profileOpen, societyId]);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [profileOpen]);

  const activeSociety = profileSociety || societies.find((society) => String(society.id) === String(societyId));
  const societyName = activeSociety?.name || activeSociety?.society_name || activeSociety?.societyName || 'Society details';
  const societyAddress = activeSociety?.address || activeSociety?.registered_address || activeSociety?.registeredAddress;
  const societyEmail = activeSociety?.email || activeSociety?.society_email || activeSociety?.societyEmail || activeSociety?.contact_email;
  const societyPhone = activeSociety?.phone || activeSociety?.society_phone || activeSociety?.societyPhone || activeSociety?.contact_phone;

  return (
    <>
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

        <div className="user-menu-wrap">
          <button
            type="button"
            className="user-menu"
            onClick={() => setProfileOpen(true)}
            aria-expanded={profileOpen}
            aria-haspopup="dialog"
            aria-label={`Open profile for ${fullName}`}
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
        </div>
      </div>
    </header>
      {profileOpen && (
        <div className="profile-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
          <aside className="profile-drawer" role="dialog" aria-modal="true" aria-labelledby="profile-drawer-title">
            <header className="profile-drawer-header">
              <h2 id="profile-drawer-title">Profile</h2>
              <button type="button" className="profile-close" onClick={() => setProfileOpen(false)} aria-label="Close profile"><X size={18} /></button>
            </header>
            <div className="profile-drawer-scroll">
              <section className="profile-hero">
                <span className="profile-hero-avatar">
                  {avatarImageUrl && !avatarImageFailed ? <img src={avatarImageUrl} alt={`${fullName} profile`} onError={() => setAvatarImageFailed(true)} /> : initial}
                </span>
                <div className="profile-hero-copy"><h3>{fullName}</h3><span><Building2 size={14} />{societyName}</span></div>
              </section>

              <section className="profile-section">
                <h3 className="profile-section-label">Your contact</h3>
                <div className="profile-info-card">
                  <span className="profile-info-icon"><Mail size={17} /></span>
                  <span><small>Email</small><strong>{user?.email || 'Not provided'}</strong></span>
                </div>
                <div className="profile-info-card">
                  <span className="profile-info-icon"><Phone size={17} /></span>
                  <span><small>Phone</small><strong>{user?.phone || 'Not provided'}</strong></span>
                </div>
              </section>

              <section className="profile-section">
                <h3 className="profile-section-label">Society details</h3>
                <div className="profile-society-card">
                  <div className="profile-info-card profile-society-name">
                    <span className="profile-info-icon"><Building2 size={17} /></span>
                    <span><small>Your society</small><strong>{societyLoading ? 'Loading society…' : societyName}</strong></span>
                  </div>
                  {societyAddress && <div className="profile-info-card">
                    <span className="profile-info-icon profile-location-icon"><MapPin size={17} /></span>
                    <span><small>Address</small><strong>{societyAddress}</strong></span>
                  </div>}
                  {(societyEmail || societyPhone) && <div className="profile-society-contacts">
                    {societyEmail && <a className="profile-contact-tile" href={`mailto:${societyEmail}`}><span className="profile-info-icon"><Mail size={16} /></span><span><small>Society email</small><strong>{societyEmail}</strong></span></a>}
                    {societyPhone && <a className="profile-contact-tile" href={`tel:${societyPhone}`}><span className="profile-info-icon"><Phone size={16} /></span><span><small>Society phone</small><strong>{societyPhone}</strong></span></a>}
                  </div>}
                </div>
              </section>

              <section className="profile-section profile-quick-actions">
                <h3 className="profile-section-label">Quick actions</h3>
                
                <Link to="/change-password" className="profile-action" onClick={() => setProfileOpen(false)}>
                  <span className="profile-info-icon"><KeyRound size={17} /></span>
                  <span><strong>Reset password</strong><small>Change your login password</small></span>
                  <ArrowUpRight size={16} />
                </Link>
                <button type="button" className="profile-action profile-logout" onClick={() => { setProfileOpen(false); logout(); }}>
                  <span className="profile-info-icon"><LogOut size={17} /></span>
                  <span><strong>Logout</strong><small>Sign out of this session</small></span>
                  <ArrowUpRight size={16} />
                </button>
                <button type="button" className="profile-action profile-logout-all" onClick={() => { setProfileOpen(false); logoutAll(); }}>
                  <span className="profile-info-icon"><LogOut size={17} /></span>
                  <span><strong>Sign out on all devices</strong><small>End all active sessions</small></span>
                  <ArrowUpRight size={16} />
                </button>
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
