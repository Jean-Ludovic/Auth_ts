import type { User } from '@/types/auth';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(user: User | null | undefined) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
import { api } from '@/lib/api-client';

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  role: 'user' | 'admin';
  createdAt: string;
};

export type SignupPoint = { date: string; count: number };

export async function listUsers(): Promise<AdminUserRow[]> {
  const res = await api.get<AdminUserRow[]>('/admin/users');
  return res.data;
}

export async function getSignups(days = 30): Promise<SignupPoint[]> {
  const res = await api.get<SignupPoint[]>(`/admin/stats/signups?days=${days}`);
  return res.data;
}
