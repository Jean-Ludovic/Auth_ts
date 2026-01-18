/**
 * Zustand auth store
 * Global state management for authentication
 */

import { create } from 'zustand';
import type { User, AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  // Helper getters
  isAuthenticated: () => boolean;
}

/**
 * Zustand store for authentication state
 * Manages user data and authentication status globally
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,

  // Set user and update authentication status
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  // Set loading state
  setLoading: (isLoading) =>
    set({
      isLoading,
    }),

  // Logout - clear user and token
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
    // Token is cleared in the logout API call
  },

  // Helper method to check authentication status
  isAuthenticated: () => {
    const state = get();
    return !!state.user && state.isAuthenticated;
  },
}));