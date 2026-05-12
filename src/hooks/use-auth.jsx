import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'nanotoxi_token';
const REFRESH_KEY = 'nanotoxi_refresh';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

  const checkAuth = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        setUser(null);
        setLoading(false);
        return;
      }
      const me = await res.json();
      const now = new Date();
      const trialExpiry = me.trial_expires_at ? new Date(me.trial_expires_at) : null;
      const isExpiredVal = me.subscription_status !== 'active' && trialExpiry !== null && trialExpiry < now;
      const hasAccessVal = me.has_access ?? (!isExpiredVal);
      setUser({
        id: me.id,
        email: me.email,
        name: me.name,
        role: me.role === 'admin' ? 'developer' : me.role,
        subscription_status: me.subscription_status || 'none',
        trialExpiry: me.trial_expires_at || null,
      });
      setIsExpired(isExpiredVal);
      setIsDeveloper(me.role === 'developer' || me.role === 'admin');
      setHasAccess(hasAccessVal);
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    try {
      if (token) {
        await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refresh_token: refresh || '' }),
        });
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isExpired, isDeveloper, hasAccess, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);