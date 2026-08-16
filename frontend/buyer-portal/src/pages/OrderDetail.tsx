import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { buyerApi } from "../api/buyer";
import type { Order } from "@shared/types";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={`star${n <= value ? " active" : ""}`} onClick={() => onChange(n)} aria-label={`${n} stars`}>★</button>
      ))}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [sellerRating, setSellerRating] = useState(5);
  const [courierRating, setCourierRating] = useState(5);
  const [sellerComment, setSellerComment] = useState("");
  const [courierComment, setCourierComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    if (id) buyerApi.getOrder(id).then((r) => setOrder(r.order));
  };

  useEffect(() => {
    load();
  }, [id]);

  const rateSeller = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    try {
      await buyerApi.rateSeller(id, sellerRating, sellerComment || undefined);
      setMessage("Thank you for rating the seller!");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rating failed");
    }
  };

  const rateCourier = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    try {
      await buyerApi.rateCourier(id, courierRating, courierComment || undefined);
      setMessage("Thank you for rating the courier!");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rating failed");
    }
  };

  const cancel = async () => {
    if (!id || !confirm("Cancel this order?")) return;
    await buyerApi.cancelOrder(id);
    load();
  };

  if (!order) return <div className="loading-screen">Loading…</div>;

  const sellerRated = order.seller_rating as { rating: number } | undefined;
  const courierRated = order.courier_rating as { rating: number } | undefined;

  return (
    <>
      <PageHeader title={`Order ${order.id.slice(0, 8)}…`} subtitle="Order details and ratings" />
      <div className="page-body">
        <Link to="/orders" className="auth-back-link" style={{ marginBottom: "1rem", display: "inline-flex" }}>← Back to orders</Link>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <span className={`badge badge-${order.status}`}>{order.status}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}>₹{order.subtotal}</span>
          </div>

          <div className="order-summary-grid">
            <p><strong>Payment</strong> {order.payment_method.toUpperCase()} · {order.payment_status}</p>
            <p><strong>Address</strong> {order.shipping.line1}, {order.shipping.city}, {order.shipping.state}</p>
            {order.courier && <p><strong>Courier</strong> {order.courier.name}</p>}
          </div>

          <ul className="order-items-list">
            {order.items.map((item) => (
              <li key={item.id}>
                <span>{item.title} × {item.quantity}</span>
                <strong>₹{item.line_total}</strong>
              </li>
            ))}
          </ul>

          {order.status === "placed" && (
            <button type="button" className="btn btn-danger" onClick={cancel}>Cancel order</button>
          )}

          {order.status === "delivered" && (
            <div className="ratings-section">
              {sellerRated ? (
                <p className="alert alert-success">Seller rated: {sellerRated.rating}/5 ★</p>
              ) : (
                <form onSubmit={rateSeller} className="rating-form">
                  <h3>Rate the seller</h3>
                  <StarRating value={sellerRating} onChange={setSellerRating} />
                  <textarea placeholder="Share your experience (optional)" value={sellerComment} onChange={(e) => setSellerComment(e.target.value)} />
                  <button type="submit" className="btn btn-primary btn-sm">Submit rating</button>
                </form>
              )}

              {order.courier && (
                courierRated ? (
                  <p className="alert alert-success">Courier rated: {courierRated.rating}/5 ★</p>
                ) : (
                  <form onSubmit={rateCourier} className="rating-form">
                    <h3>Rate {order.courier.name}</h3>
                    <StarRating value={courierRating} onChange={setCourierRating} />
                    <textarea placeholder="How was the delivery? (optional)" value={courierComment} onChange={(e) => setCourierComment(e.target.value)} />
                    <button type="submit" className="btn btn-primary btn-sm">Submit rating</button>
                  </form>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
