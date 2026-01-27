import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import * as authApi from '@/api/auth';
import { isAdmin } from '@/lib/isAdmin';

import type {
  LoginCredentials,
  RegisterCredentials,
  EmailVerificationRequest,
} from '@/types/auth';

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    user,
    setUser,
    setLoading,
    logout: clearAuth,
    isLoading: storeIsLoading,
  } = useAuthStore();

  const {
    data: userData,
    isLoading: queryIsLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.getCurrentUser,
    enabled: false,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (userData && userData !== user) setUser(userData);
  }, [userData, user, setUser]);

  // ✅ LOGIN
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      const result = await refetchUser();
      const u = result.data;

      toast.success('Login successful');
      navigate(isAdmin(u) ? '/admin' : '/dashboard', { replace: true });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Login failed. Please check your credentials.';
      toast.error(message);
    },
  });

  // REGISTER
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast.success('Registration successful. Please verify your email.');
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
        replace: true,
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';
      toast.error(message);
    },
  });

  // ✅ VERIFY EMAIL
  const verifyEmailMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: async () => {
      const result = await refetchUser();
      const u = result.data;

      toast.success('Email verified successfully');
      navigate(isAdmin(u) ? '/admin' : '/dashboard', { replace: true });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Verification failed. Please check your code.';
      toast.error(message);
    },
  });

  // LOGOUT
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    },
    onError: (error: unknown) => {
      clearAuth();
      queryClient.clear();
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    },
  });

  const initializeAuth = async () => {
    setLoading(true);
    try {
      const result = await refetchUser();
      if (result.data) setUser(result.data);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isLoading: storeIsLoading || queryIsLoading,
    isAuthenticated: !!user,

    login: (credentials: LoginCredentials) => loginMutation.mutate(credentials),
    register: (credentials: RegisterCredentials) =>
      registerMutation.mutate(credentials),
    verifyEmail: (request: EmailVerificationRequest) =>
      verifyEmailMutation.mutate(request),
    logout: () => logoutMutation.mutate(),
    initializeAuth,

    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isVerifying: verifyEmailMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
