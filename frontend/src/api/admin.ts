import { api } from '@/lib/api-client';

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  role?: 'user' | 'admin';
  createdAt: string;
};

export type SignupPoint = {
  date: string;
  count: number;
};

export async function listUsers(): Promise<AdminUserRow[]> {
  const res = await api.get<AdminUserRow[]>('/admin/users');
  return res.data;
}

export async function getSignups(days = 30): Promise<SignupPoint[]> {
  const res = await api.get<SignupPoint[]>(`/admin/stats/signups?days=${days}`);
  return res.data;
}
