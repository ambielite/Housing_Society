import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth.context';
import * as authApi from '../../features/auth/api/auth.api';
import { tokenStorage, societyStorage } from '../../lib/axios';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only "loading" at startup if there is a saved token to verify.
  const [isLoading, setIsLoading] = useState(Boolean(tokenStorage.getAccess()));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    societyStorage.clear();
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    if (!tokenStorage.getAccess()) return undefined;
    let cancelled = false;
    authApi
      .fetchProfile()
      .then((profile) => {
        if (!cancelled) {
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
        }
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // The axios layer fires this when a token can no longer be refreshed.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    societyStorage.clear(); // never carry a previous user's society override
    tokenStorage.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Even if the server call fails, the user must still be signed out locally.
    }
    clearSession();
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch {
      // same reasoning as logout()
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => {
    const roles = user?.roles || [];
    const permissions = user?.permissions || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN'); // backend skips permission checks for this role

    const hasPermission = (code) => isSuperAdmin || permissions.includes(code);
    const hasAnyPermission = (...codes) => codes.flat().some(hasPermission);
    const hasRole = (code) => roles.includes(code);

    return {
      user,
      roles,
      permissions,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      logoutAll,
      clearSession,
      hasPermission,
      hasAnyPermission,
      hasRole,
    };
  }, [user, isLoading, login, logout, logoutAll, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
