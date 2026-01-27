import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import * as adminApi from '@/api/admin';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

export function AdminDashboardPage() {
  const { logout, isLoggingOut } = useAuth();
  const [q, setQ] = useState('');

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.listUsers,
  });

  const { data: signups = [], isLoading: signupsLoading } = useQuery({
    queryKey: ['admin', 'signups', 30],
    queryFn: () => adminApi.getSignups(30),
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(u =>
      u.email.toLowerCase().includes(s) ||
      u.username.toLowerCase().includes(s)
    );
  }, [q, users]);

  const totals = useMemo(() => {
    const total = users.length;
    const verified = users.filter(u => u.emailVerified).length;
    const admins = users.filter(u => u.role === 'admin').length;
    return { total, verified, unverified: total - verified, admins };
  }, [users]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Users & registrations overview</p>
          </div>
          <Button onClick={() => logout()} disabled={isLoggingOut} variant="outline">
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total users</CardDescription>
              <CardTitle className="text-2xl">{totals.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Verified</CardDescription>
              <CardTitle className="text-2xl">{totals.verified}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unverified</CardDescription>
              <CardTitle className="text-2xl">{totals.unverified}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admins</CardDescription>
              <CardTitle className="text-2xl">{totals.admins}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Signups (last 30 days)</CardTitle>
            <CardDescription>Daily registrations</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {signupsLoading ? (
              <p className="text-sm text-muted-foreground">Loading chart...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signups}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Search and review users</CardDescription>
              </div>
              <div className="w-full max-w-sm">
                <Input
                  placeholder="Search by email or username..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Username</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Verified</th>
                      <th className="px-3 py-2 text-left font-medium">Role</th>
                      <th className="px-3 py-2 text-left font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} className="border-b">
                        <td className="px-3 py-2">@{u.username}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2">
                          {u.emailVerified ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-yellow-600">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{u.role}</td>
                        <td className="px-3 py-2 font-mono text-xs">{String(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>



  );
}
