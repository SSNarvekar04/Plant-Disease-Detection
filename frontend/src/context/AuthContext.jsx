import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService, userService } from '../services';
import { tokenStore } from '../services/api';

/**
 * Authentication state for the whole app.
 *
 * The JWT is kept in localStorage so a page refresh keeps the user signed in.
 * On startup the token is verified against `GET /api/auth/me`, which also
 * confirms the account has not been deleted or deactivated by an admin.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenStore.get());
  // `checking` stays true until the startup verification finishes, which stops
  // protected routes from redirecting to /login while we are still restoring.
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  // Restore the session on first mount.
  useEffect(() => {
    const storedToken = tokenStore.get();
    if (!storedToken) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    authService
      .me()
      .then((response) => {
        if (!cancelled) setUser(response.data.user);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // The API client fires this when it receives a 401 for a stored token.
  useEffect(() => {
    const handleUnauthorised = () => clearSession();
    window.addEventListener('pdd:unauthorised', handleUnauthorised);
    return () => window.removeEventListener('pdd:unauthorised', handleUnauthorised);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    tokenStore.set(response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await authService.register(payload);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The token is dropped client side regardless of the server answer.
    }
    clearSession();
  }, [clearSession]);

  /** Re-reads the profile from the server (after a profile update). */
  const refreshUser = useCallback(async () => {
    const response = await userService.getProfile();
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const response = await userService.updateProfile(payload);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      checking,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [user, token, checking, login, register, logout, refreshUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads the auth context.
 * @returns {import('./AuthContext.jsx').AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}

export { AuthContext };