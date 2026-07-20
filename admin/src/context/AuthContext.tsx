import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, adminAPI } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      adminAPI.getProfile().then((res) => {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('adminUser', JSON.stringify(userData));
      }).catch(() => {
        logout();
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { user: userData, accessToken, refreshToken } = res.data.data;
    
    // Check if user is admin
    if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied. Admin only.');
    }

    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminRefreshToken', refreshToken);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    // Try to notify server but don't block
    authAPI.logout().catch(() => {});
  };

  const updateProfile = async (data: any) => {
    const res = await adminAPI.updateProfile(data);
    setUser(res.data.data);
    localStorage.setItem('adminUser', JSON.stringify(res.data.data));
    toast.success('Profile updated successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}