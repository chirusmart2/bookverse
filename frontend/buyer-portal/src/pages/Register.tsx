import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@shared/apiClient";
import { IconArrowLeft } from "../components/Icons";

const LANDING_URL = import.meta.env.VITE_LANDING_URL || "http://localhost:5172";

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register({ ...form, role: "buyer" });
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout theme-buyer">
      <div className="auth-panel-brand">
        <div className="auth-brand-content">
          <h1>Join BookVerse</h1>
          <p>Create your account and start exploring books from sellers across the marketplace.</p>
        </div>
      </div>
      <div className="auth-panel-form">
        <div className="auth-form-card">
          <a href={LANDING_URL} className="auth-back-link">
            <IconArrowLeft /> Back to home
          </a>
          <h2>Create account</h2>
          <p className="subtitle">Register as a buyer</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First name</label>
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Last name</label>
                <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
            Have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
