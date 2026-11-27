import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/constants';
import { hasMinRole } from '../utils/role.util';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN) || '');
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setToken('');
    setUser(null);
  }, []);

  const loginSuccess = useCallback((newToken, userProfile) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
    setToken(newToken);
    setUser(userProfile);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('rpg:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('rpg:unauthorized', handleUnauthorized);
  }, [logout]);

  const role = user?.role || 'GUEST';
  const isAuthenticated = Boolean(token && user);

  const checkRole = useCallback(
    (minRole) => hasMinRole(role, minRole),
    [role]
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        loginSuccess,
        logout,
        checkRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}