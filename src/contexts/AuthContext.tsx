import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { API_URL, AUTH_EXPIRED_EVENT } from '@/api/apiClient';
import {
  clearAllTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/authStorage';

export type UserRole = 'admin' | 'user' | 'member';

export type FreightNetwork = 'WCA' | 'MPL' | 'EAN' | 'JCtrans';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  company?: string;
  name?: string;
  nationality?: string;
  networks?: FreightNetwork[];
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, company?: string, name?: string, nationality?: string, networks?: FreightNetwork[]) => Promise<AuthResult>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getAuthErrorMessage(response: Response, fallback: string): Promise<string> {
  const status = response.status;
  if (status === 401) return 'Invalid credentials';
  if (status === 403) return 'Access denied';
  if (status >= 500) return 'Server error';
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return fallback;

  const body = await response.json().catch(() => ({}));
  const message =
    body?.error?.message ||
    body?.error ||
    body?.errors?.[0];

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!getRefreshToken());

  // Restore session on mount using refresh token
  useEffect(() => {
    const refreshToken = getRefreshToken();

    // Migration: remove legacy localStorage token
    localStorage.removeItem('smartQuoteToken');

    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Refresh failed');
      })
      .then((data: { token: string; user: User }) => {
        setAccessToken(data.token);
        setUser(data.user);
      })
      .catch(() => {
        clearAllTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-refresh access token every 14 minutes (token expires in 15)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;
      fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
        .then(res => { if (res.ok) return res.json(); throw new Error(); })
        .then((data: { token: string }) => setAccessToken(data.token))
        .catch(() => { /* next API call will trigger 401 → retry logic */ });
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.token);
        setRefreshToken(data.refresh_token);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: await getAuthErrorMessage(res, 'Login failed') };
    } catch (e) {
      Sentry.captureException(e);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    company?: string,
    name?: string,
    nationality?: string,
    networks?: FreightNetwork[]
  ): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, password_confirmation: password,
          company, name, nationality,
          networks: networks && networks.length > 0 ? networks : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.token);
        setRefreshToken(data.refresh_token);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: await getAuthErrorMessage(res, 'Registration failed') };
    } catch (e) {
      Sentry.captureException(e);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAllTokens();
    setUser(null);
  }, []);

  // Listen for 401 auth expiry events from apiClient
  useEffect(() => {
    const handleAuthExpired = () => {
      clearAllTokens();
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      const { getAccessToken } = await import('@/lib/authStorage');
      const token = getAccessToken();
      if (!token) throw new Error('No token found');

      const res = await fetch(`${API_URL}/api/v1/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPassword
        }),
      });

      if (res.ok) {
        return { success: true };
      }

      return { success: false, error: await getAuthErrorMessage(res, 'Password update failed') };
    } catch (e) {
      Sentry.captureException(e);
      return { success: false, error: 'Network error' };
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-jways-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user, login, signup, logout, updatePassword,
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
