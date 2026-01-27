import { api } from "@/lib/api-client";

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  new_password: string;
}): Promise<{ message: string }> {
  const res = await api.post("/auth/reset-password", payload);
  return res.data;
}
