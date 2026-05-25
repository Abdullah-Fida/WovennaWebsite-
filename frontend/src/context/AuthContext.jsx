import { createContext, useContext, useState, useEffect } from 'react';
import { verifyAuth as verifyAuthAPI, loginUser as loginAPI, registerUser as registerAPI, logoutUser as logoutAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await verifyAuthAPI();
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await loginAPI({ email, password });
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerAPI({ name, email, password });
    return data;
  };

  const logout = async () => {
    await logoutAPI();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
