import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUserProfile, logoutUser } from '../api';
import { isTokenExpired, onUnauthorized, tokenStorage } from '../api/client';
import { formatCurrency } from '../utils/format';

const USER_KEY = 'user';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

function initialToken() {
  const token = tokenStorage.get();
  if (token && isTokenExpired(token)) {
    tokenStorage.clear();
    storeUser(null);
    return null;
  }
  return token;
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(() => (token ? readStoredUser() : null));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    storeUser(null);
    setToken(null);
    setUser(null);
  }, []);

  /** Stores the session returned by /auth/login or /auth/signup. */
  const login = useCallback((newToken, newUser) => {
    tokenStorage.set(newToken);
    storeUser(newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.get()) await logoutUser();
    } catch {
      /* the token is discarded either way */
    }
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  /** Re-fetches the profile (e.g. after the user changes their name or currency). */
  const refreshUser = useCallback(async () => {
    const profile = await getUserProfile();
    storeUser(profile);
    setUser(profile);
    return profile;
  }, []);

  /** Merges local changes into the cached user without a round trip. */
  const updateUser = useCallback((changes) => {
    setUser((prev) => {
      const next = { ...prev, ...changes };
      storeUser(next);
      return next;
    });
  }, []);

  // Any authenticated request that comes back 401 ends the session.
  useEffect(() => {
    onUnauthorized(() => {
      clearSession();
      toast.error('Your session has expired. Please log in again.', { id: 'session-expired' });
      // Remember the page so the user returns to it after logging in again.
      const { pathname, search, hash } = window.location;
      navigate('/login', { replace: true, state: { from: { pathname, search, hash } } });
    });
    return () => onUnauthorized(null);
  }, [clearSession, navigate]);

  // Refresh the cached profile once per page load.
  useEffect(() => {
    if (token) refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currency = user?.currency_preference || 'USD';
  const formatMoney = useCallback((amount) => formatCurrency(amount, currency), [currency]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      currency,
      formatMoney,
      login,
      logout,
      refreshUser,
      updateUser,
    }),
    [token, user, currency, formatMoney, login, logout, refreshUser, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
