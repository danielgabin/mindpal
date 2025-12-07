/**
 * Zustand store for authentication state management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        // Store tokens in localStorage for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        // Clear tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated: () => {
        const state = get();
        return !!state.user && !!state.accessToken;
      },
    }),
    {
      name: 'mindpal-auth',
      // Persist everything (user, accessToken, refreshToken)
    }
  )
);

