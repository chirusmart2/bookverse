import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconArrowLeft } from "../components/Icons";
import { useAuth } from "../context/AuthContext";

const LANDING_URL = import.meta.env.VITE_LANDING_URL || "http://localhost:5172";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-panel-brand">
        <div className="auth-brand-content">
          <h1>Grow your book business</h1>
          <p>
            List inventory, manage orders, assign couriers, and track deliveries — all from your
            seller dashboard.
          </p>
        </div>
      </div>
      <div className="auth-panel-form">
        <div className="auth-form-card">
          <a href={LANDING_URL} className="auth-back-link">
            <IconArrowLeft /> Back to home
          </a>
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your seller account</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
            New seller? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
