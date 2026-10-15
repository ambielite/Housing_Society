import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SocietyContext } from './society.context';
import useAuth from '../providers/useAuth';
import { societyStorage } from '../../lib/axios';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const value = useMemo(() => ({
    sidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    toggleSidebar: () => setSidebarOpen((open) => !open),
  }), [sidebarOpen]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi must be used inside <UiProvider>');
  return context;
}

const normalizeSocietyId = (value) => String(value ?? '').replace(/^:+/, '').trim();

function readStoredSociety() {
  try {
    const stored = localStorage.getItem('selectedSociety');
    const parsed = stored ? JSON.parse(stored) : null;
    const id = normalizeSocietyId(parsed?.id ?? parsed?.societyId);
    if (!parsed || !id) return null;
    return { ...parsed, id };
  } catch {
    return null;
  }
}

export function SocietyProvider({ children }) {
  const { user } = useAuth();
  const [selectedSociety, setSelectedSociety] = useState(readStoredSociety);
  const [override, setOverride] = useState(() => societyStorage.get() || localStorage.getItem('selectedSocietyId'));

  useEffect(() => {
    if (!user) {
      setOverride(null);
      societyStorage.clear();
    }
  }, [user]);

  const setSocietyId = useCallback((value) => {
    const id = normalizeSocietyId(value);
    if (id) {
      societyStorage.set(id);
      localStorage.setItem('selectedSocietyId', id);
    } else {
      societyStorage.clear();
      localStorage.removeItem('selectedSocietyId');
    }
    setOverride(id || null);
  }, []);

  const selectSociety = useCallback((society) => {
    const id = normalizeSocietyId(society?.id ?? society?.societyId);
    if (!id) {
      setSelectedSociety(null);
      localStorage.removeItem('selectedSociety');
      setSocietyId(null);
      return;
    }
    const value = { ...society, id };
    setSelectedSociety(value);
    localStorage.setItem('selectedSociety', JSON.stringify(value));
    setSocietyId(id);
  }, [setSocietyId]);

  const clearSociety = useCallback(() => {
    setSelectedSociety(null);
    localStorage.removeItem('selectedSociety');
    setSocietyId(null);
  }, [setSocietyId]);

  const value = useMemo(() => ({
    selectedSociety,
    selectSociety,
    clearSociety,
    societyId: override || user?.society_id || selectedSociety?.id || null,
    setSocietyId,
  }), [selectedSociety, selectSociety, clearSociety, override, user, setSocietyId]);

  return <SocietyContext.Provider value={value}>{children}</SocietyContext.Provider>;
}
