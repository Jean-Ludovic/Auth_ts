import { useState } from "react";
import { forgotPassword } from "@/api/password";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await forgotPassword(email);
      setStatus(res.message || "Check your email.");
    } catch (err: any) {
      setStatus(err?.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h1>Forgot Password</h1>
      <p>Enter your email to receive a reset link.</p>

      <form onSubmit={onSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="email@example.com"
          style={{ width: "100%", padding: 10, margin: "10px 0" }}
          required
        />
        <button disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
