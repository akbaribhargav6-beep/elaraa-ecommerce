'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserDTO } from '@elaraa/shared';
import { api, setAccessToken, ApiClientError } from './api-client';

interface AuthContextValue {
  user: UserDTO | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserDTO>;
  register: (input: { email: string; password: string; firstName: string; lastName?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Fired after a successful login so CartContext (a sibling provider) can
// merge the guest cart and refetch — decoupled via a DOM event instead of a
// direct import to avoid circular context dependencies.
export const CART_SHOULD_REFRESH_EVENT = 'elaraa:cart-refresh';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Silently attempt to restore a session from the httpOnly refresh cookie.
    api
      .post<{ user: UserDTO; accessToken: string }>('/api/auth/refresh', undefined, { skipAuthRetry: true })
      .then((data) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: UserDTO; accessToken: string }>('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    await api.post('/api/cart/merge').catch(() => {});
    window.dispatchEvent(new Event(CART_SHOULD_REFRESH_EVENT));
    return data.user;
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; firstName: string; lastName?: string; phone?: string }) => {
      await api.post('/api/auth/register', input);
    },
    []
  );

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout').catch(() => {});
    setAccessToken(null);
    setUser(null);
    window.dispatchEvent(new Event(CART_SHOULD_REFRESH_EVENT));
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post('/api/auth/forgot-password', { email });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await api.post('/api/auth/reset-password', { token, password });
  }, []);

  const refetchUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: UserDTO }>('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword, resetPassword, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
