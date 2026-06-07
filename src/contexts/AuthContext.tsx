import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { API_URL, AUTH_EXPIRED_EVENT } from '@/api/apiClient';
import {
  clearAllTokens,
  setAccessToken,
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

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (
    email: string,
    password: string,
    company?: string,
    name?: string,
    nationality?: string,
    networks?: FreightNetwork[],
  ) => Promise<AuthResult>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  requestMagicLink: (email: string) => Promise<AuthResult>;
  verifyMagicLink: (token: string) => Promise<AuthResult>;
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
  const message = body?.error?.message || body?.error || body?.errors?.[0];

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount using the HttpOnly refresh cookie.
  useEffect(() => {
    // Migration: remove legacy localStorage tokens that were readable by JavaScript.
    localStorage.removeItem('smartQuoteRefresh');
    localStorage.removeItem('smartQuoteToken');

    fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Refresh failed');
      })
      .then((data: { token: string; refresh_token?: string; user: User }) => {
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
    const interval = setInterval(
      () => {
        fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then((data: { token: string; refresh_token?: string }) => {
            setAccessToken(data.token);
          })
          .catch(() => {
            /* next API call will trigger 401 → retry logic */
          });
      },
      14 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: await getAuthErrorMessage(res, 'Login failed') };
    } catch (e) {
      Sentry.captureException(e);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      company?: string,
      name?: string,
      nationality?: string,
      networks?: FreightNetwork[],
    ): Promise<AuthResult> => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
            password_confirmation: password,
            company,
            name,
            nationality,
            networks: networks && networks.length > 0 ? networks : undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.token);
          setUser(data.user);
          return { success: true, user: data.user };
        }

        return { success: false, error: await getAuthErrorMessage(res, 'Registration failed') };
      } catch (e) {
        Sentry.captureException(e);
        return { success: false, error: 'Network error' };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    void fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Local logout should still complete even if the network is unavailable.
    });
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

  const requestMagicLink = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/magic_link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        return { success: true };
      }

      return { success: false, error: await getAuthErrorMessage(res, 'Failed to send magic link') };
    } catch (e) {
      Sentry.captureException(e);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const verifyMagicLink = useCallback(async (token: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/magic_link/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return {
        success: false,
        error: await getAuthErrorMessage(res, 'Invalid or expired magic link'),
      };
    } catch (e) {
      Sentry.captureException(e);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
      try {
        const { getAccessToken } = await import('@/lib/authStorage');
        const token = getAccessToken();
        if (!token) throw new Error('No token found');

        const res = await fetch(`${API_URL}/api/v1/auth/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: newPassword,
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
    },
    [],
  );

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-white dark:bg-gray-950'>
        <div className='w-6 h-6 border-2 border-gray-300 border-t-emax-500 rounded-full animate-spin' />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updatePassword,
        requestMagicLink,
        verifyMagicLink,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
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
