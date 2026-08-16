import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { buyerApi } from "../api/buyer";
import type { Order } from "@shared/types";

export function Checkout() {
  const navigate = useNavigate();
  const [shipping, setShipping] = useState({
    line1: "", line2: "", city: "", state: "", postal_code: "", country: "IN",
  });
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await buyerApi.checkout(shipping);
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (orders) {
    return (
      <>
        <PageHeader title="Order placed!" subtitle="Cash on delivery" />
        <div className="page-body">
          <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
            <h2 style={{ marginBottom: "0.5rem" }}>Thank you!</h2>
            <p className="text-secondary" style={{ marginBottom: "1.5rem" }}>
              Pay when your order is delivered. {orders.length} order{orders.length > 1 ? "s" : ""} created.
            </p>
            <ul style={{ listStyle: "none", textAlign: "left", maxWidth: 400, margin: "0 auto 2rem" }}>
              {orders.map((o) => (
                <li key={o.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                  <code>{o.id.slice(0, 8)}…</code>
                  <span>₹{o.subtotal}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" onClick={() => navigate("/orders")}>View my orders</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Checkout" subtitle="Cash on delivery — pay when delivered" />
      <div className="page-body">
        <div className="card form-card" style={{ maxWidth: 560 }}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Address line 1</label>
              <input value={shipping.line1} onChange={(e) => setShipping({ ...shipping, line1: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Address line 2 <span className="muted">(optional)</span></label>
              <input value={shipping.line2} onChange={(e) => setShipping({ ...shipping, line2: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>State</label>
                <input value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Postal code</label>
                <input value={shipping.postal_code} onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} required />
              </div>
            </div>
            <div className="alert" style={{ background: "var(--color-primary-muted)", border: "1px solid var(--color-primary-soft)", color: "var(--color-primary)" }}>
              💵 Payment method: <strong>Cash on Delivery</strong>
            </div>
            <div className="page-actions">
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? "Placing order…" : "Place order"}
              </button>
              <Link to="/cart" className="btn btn-secondary">Back to cart</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
