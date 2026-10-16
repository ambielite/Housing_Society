import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Moon, Sun } from 'lucide-react';
import useAuth from '../../app/providers/useAuth';
import useTheme from '../../app/providers/useTheme';
import useSociety from '../../app/store/useSociety';
import { useUi } from '../../app/store/ui.store';
import api, { societyStorage } from '../../lib/axios';

export const roleLabel = (code) =>
  code
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function Topbar() {
  const { user, roles, logout, logoutAll } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useUi();
  const { societyId, setSocietyId } = useSociety();
  const [societies, setSocieties] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
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
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    void refreshSocieties();
    window.addEventListener('housing:societies-updated', refreshSocieties);
    return () => window.removeEventListener('housing:societies-updated', refreshSocieties);
  }, [refreshSocieties]);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email;
  const initial = (user?.first_name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="mobile-menu-button" onClick={toggleSidebar} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
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
            <span className="avatar">{initial}</span>
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
