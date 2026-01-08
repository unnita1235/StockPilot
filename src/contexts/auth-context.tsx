'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, AuthResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('stockpilot_token');
    const storedUser = localStorage.getItem('stockpilot_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        // Invalid stored data, clear it
        localStorage.removeItem('stockpilot_token');
        localStorage.removeItem('stockpilot_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('stockpilot_token', result.token);
    localStorage.setItem('stockpilot_user', JSON.stringify(result.user));
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authApi.register(email, password, name);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('stockpilot_token', result.token);
    localStorage.setItem('stockpilot_user', JSON.stringify(result.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('stockpilot_token');
    localStorage.removeItem('stockpilot_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

