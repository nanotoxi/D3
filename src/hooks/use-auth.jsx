import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

  const checkAuth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setIsExpired(data.isExpired);
        setIsDeveloper(data.isDeveloper);
        setHasAccess(data.hasAccess);
      } else {
        setUser(null);
        setHasAccess(true); // Allow public routes
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isExpired, isDeveloper, hasAccess, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
