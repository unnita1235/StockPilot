'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    // We only load the User object for UI purposes. 
    // The actual authentication is handled via HTTP-Only cookies.
    const storedUser = localStorage.getItem('stockpilot_user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('stockpilot_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // API now sets a cookie. We only receive the user object.
    const result = await authApi.login(email, password);
    setUser(result.user);
    localStorage.setItem('stockpilot_user', JSON.stringify(result.user));
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authApi.register(email, password, name);
    setUser(result.user);
    localStorage.setItem('stockpilot_user', JSON.stringify(result.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stockpilot_user');
    // Ideally call an endpoint like /auth/logout to clear the cookie on server
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        // If we have a user object, we assume we are authenticated.
        // The backend will reject requests if the cookie is invalid.
        isAuthenticated: !!user,
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