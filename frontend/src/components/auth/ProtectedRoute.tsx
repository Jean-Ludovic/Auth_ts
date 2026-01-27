/**
 * ProtectedRoute component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/isAdmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean; // ✅ ajout
}

/**
 * ProtectedRoute component
 * Checks authentication status before rendering children
 * Redirects to login with return URL if not authenticated
 */
export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Admin gate
  if (adminOnly && !isAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
