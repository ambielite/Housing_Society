import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SocietyContext } from './society.context';
import useAuth from '../providers/useAuth';
import { societyStorage } from '../../lib/axios';

// ---- UI state (mobile sidebar) ------------------------------------------
const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const value = useMemo(
    () => ({
      sidebarOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      toggleSidebar: () => setSidebarOpen((open) => !open),
    }),
    [sidebarOpen]
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi must be used inside <UiProvider>');
  return context;
}

// ---- Active society -------------------------------------------------------
// Defaults to the logged-in user's own society. setSocietyId() is for the
// future multi-society switcher; it is sent to the API as x-society-id.
export function SocietyProvider({ children }) {
  const { user, isLoading } = useAuth();
  const [override, setOverride] = useState(() => societyStorage.get());

  useEffect(() => {
    // Keep the saved selection while AuthProvider verifies a restored session.
    // AuthProvider clears societyStorage on logout, so only clear stale React
    // state once loading has finished and there is no signed-in user.
    if (!user && !isLoading) setOverride(null);
  }, [user, isLoading]);

  const setSocietyId = useCallback((id) => {
    if (id) societyStorage.set(id);
    else societyStorage.clear();
    setOverride(id || null);
  }, []);

  const value = useMemo(
    () => ({ societyId: override || user?.society_id || null, setSocietyId, selectSociety: (society) => setSocietyId(society?.id || society?.societyId || society || null) }),
    [override, user, setSocietyId]
  );

  return <SocietyContext.Provider value={value}>{children}</SocietyContext.Provider>;
}
