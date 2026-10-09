import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('et_token')));

  useEffect(() => {
    if (!localStorage.getItem('et_token')) return undefined;
    authService.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem('et_token')).finally(() => setLoading(false));
    return undefined;
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const authenticate = useCallback(async (fn, body) => {
    const { user: u, token } = await fn(body);
    localStorage.setItem('et_token', token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({
      user, loading, currency: user?.currency || 'INR',
      login: (b) => authenticate(authService.login, b),
      register: (b) => authenticate(authService.register, b),
      logout: () => { localStorage.removeItem('et_token'); setUser(null); },
      updateProfile: async (b) => setUser((await authService.updateProfile(b)).user),
    }),
    [user, loading, authenticate]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
