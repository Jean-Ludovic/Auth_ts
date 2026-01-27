/**
 * Dashboard page
 * Protected route demonstrating authenticated access
 */

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DashboardPage() {
  const { user, logout, isLoggingOut } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your authenticated dashboard
            </p>
          </div>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Email Verified
              </p>
              <p className="text-lg">
                {user?.emailVerified ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-yellow-600">No</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                User ID
              </p>
              <p className="text-lg font-mono text-sm">{user?.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}