/**
 * AuthProvider component
 * Initializes authentication state and provides auth context
 * Should wrap the entire application
 */

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component
 * Initializes auth state on mount and handles authentication lifecycle
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth, isLoading } = useAuth();

  useEffect(() => {
    // Initialize auth state when app loads
    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading state while initializing auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}