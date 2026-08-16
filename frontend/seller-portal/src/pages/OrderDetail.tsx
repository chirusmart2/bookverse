import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { sellerApi } from "../api/seller";
import type { Courier, Order } from "@shared/types";

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [courierId, setCourierId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!id) return;
    sellerApi.getOrder(id).then((r) => setOrder(r.order));
  };

  useEffect(() => {
    load();
    sellerApi.listCouriers().then((r) => setCouriers(r.couriers));
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await sellerApi.updateOrderStatus(id, status, status === "shipped" ? courierId : undefined);
      setMessage(`Order updated to ${status}.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return <div className="loading-screen">Loading order…</div>;
  }

  return (
    <>
      <PageHeader title={`Order ${order.id.slice(0, 8)}…`} subtitle="Fulfillment and status" />
      <div className="page-body">
        <Link to="/orders" className="auth-back-link" style={{ marginBottom: "1rem", display: "inline-flex" }}>
          ← Back to orders
        </Link>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <span className={`badge badge-${order.status}`} style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem" }}>{order.status}</span>
            <div style={{ textAlign: "right" }}>
              <div className="muted" style={{ fontSize: "0.8rem" }}>Subtotal</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}>₹{order.subtotal}</div>
            </div>
          </div>

          <div className="order-summary-grid">
            <p><strong>Payment</strong> {order.payment_method.toUpperCase()} · {order.payment_status}</p>
            <p><strong>Ship to</strong> {order.shipping.line1}, {order.shipping.city}, {order.shipping.state} {order.shipping.postal_code}</p>
            {order.courier && <p><strong>Courier</strong> {order.courier.name}</p>}
          </div>

          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Items</h3>
          <ul className="order-items-list">
            {order.items.map((item) => (
              <li key={item.id}>
                <span>{item.title} <span className="muted">× {item.quantity}</span></span>
                <strong>₹{item.line_total}</strong>
              </li>
            ))}
          </ul>

          <div className="actions-row">
            {order.status === "placed" && (
              <>
                <button type="button" className="btn btn-primary" disabled={loading} onClick={() => updateStatus("confirmed")}>Confirm order</button>
                <button type="button" className="btn btn-danger" disabled={loading} onClick={() => updateStatus("cancelled")}>Cancel</button>
              </>
            )}
            {order.status === "confirmed" && (
              <>
                <select value={courierId} onChange={(e) => setCourierId(e.target.value)} style={{ minWidth: 200 }}>
                  <option value="">Select courier partner</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary" disabled={loading || !courierId} onClick={() => updateStatus("shipped")}>Mark shipped</button>
                <button type="button" className="btn btn-danger" disabled={loading} onClick={() => updateStatus("cancelled")}>Cancel</button>
              </>
            )}
            {order.status === "shipped" && (
              <button type="button" className="btn btn-primary" disabled={loading} onClick={() => updateStatus("delivered")}>Mark delivered</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
