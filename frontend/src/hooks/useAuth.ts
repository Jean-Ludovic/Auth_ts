/**
 * useAuth hook
 * Main authentication hook providing auth state and actions
 * Uses TanStack Query for server state and Zustand for client state
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import * as authApi from '@/api/auth';
import type { LoginCredentials, RegisterCredentials, EmailVerificationRequest } from '@/types/auth';

/**
 * Query key factory for auth queries
 * Centralized query keys for consistency
 */
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Main authentication hook
 * Provides user data, authentication status, and auth actions
 */
export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser, setLoading, logout: clearAuth, isLoading: storeIsLoading } = useAuthStore();

  /**
   * Fetch current user from API
   * Runs on mount and when auth state changes
   */
  const { data: userData, isLoading: queryIsLoading, refetch: refetchUser } = useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.getCurrentUser,
    enabled: false, // Only fetch when explicitly called or after login
    retry: false, // Don't retry on failure - user is not authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  /**
   * Update store when user data changes
   */
  useEffect(() => {
    if (userData && userData !== user) {
      setUser(userData);
    }
  }, [userData, user, setUser]);

  /**
   * Login mutation
   * Authenticates user and stores access token
   */
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      // Fetch user data after successful login
      await refetchUser();
      toast.success('Login successful');
      navigate('/dashboard', { replace: true });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      toast.error(message);
    },
  });

  /**
   * Register mutation
   * Creates new user account
   */
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast.success('Registration successful. Please verify your email.');
      // Navigate to email verification with email pre-filled
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
        replace: true,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast.error(message);
    },
  });

  /**
   * Email verification mutation
   * Verifies email with 4-digit code
   */
  const verifyEmailMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: async () => {
      // Fetch user data after successful verification
      await refetchUser();
      toast.success('Email verified successfully');
      navigate('/dashboard', { replace: true });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Verification failed. Please check your code.';
      toast.error(message);
    },
  });

  /**
   * Logout mutation
   * Clears auth state and invalidates session
   */
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear Zustand store
      clearAuth();
      // Clear React Query cache
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    },
    onError: (error: unknown) => {
      // Even on error, clear local state
      clearAuth();
      queryClient.clear();
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    },
  });

  /**
   * Initialize auth state
   * Checks if user is authenticated on mount
   * Should be called in AuthProvider
   */
  const initializeAuth = async () => {
    setLoading(true);
    try {
      const user = await refetchUser();
      if (user.data) {
        setUser(user.data);
      }
    } catch {
      // User is not authenticated - clear state
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    user,
    isLoading: storeIsLoading || queryIsLoading,
    isAuthenticated: !!user,

    // Actions
    login: (credentials: LoginCredentials) => loginMutation.mutate(credentials),
    register: (credentials: RegisterCredentials) =>
      registerMutation.mutate(credentials),
    verifyEmail: (request: EmailVerificationRequest) =>
      verifyEmailMutation.mutate(request),
    logout: () => logoutMutation.mutate(),
    initializeAuth,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isVerifying: verifyEmailMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}