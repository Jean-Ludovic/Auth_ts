import { useEffect, useMemo, useState } from "react";
import { resetPassword } from "@/api/password";

function useQuery() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

export default function ResetPasswordPage() {
  const q = useQuery();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qEmail = q.get("email") || "";
    const qToken = q.get("token") || "";
    setEmail(qEmail);
    setToken(qToken);
  }, [q]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await resetPassword({
        email,
        token,
        new_password: newPassword,
      });
      setStatus(res.message || "Password updated. You can login now.");
    } catch (err: any) {
      setStatus(err?.response?.data?.detail || "Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h1>Reset Password</h1>
      <p>Paste the token and choose a new password.</p>

      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
          required
        />

        <label>Token</label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="text"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
          required
        />

        <label>New password</label>
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
          minLength={8}
          required
        />

        <button disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
