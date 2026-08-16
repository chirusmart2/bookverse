import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { buyerApi } from "../api/buyer";
import type { Order } from "@shared/types";

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    buyerApi.listOrders().then((r) => setOrders(r.orders));
  }, []);

  return (
    <>
      <PageHeader title="My orders" subtitle="Track and manage your purchases" />
      <div className="page-body">
        {orders.length === 0 ? (
          <div className="empty-state card">
            <p>No orders yet.</p>
            <Link to="/" className="btn btn-primary">Start shopping</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><code>{o.id.slice(0, 8)}…</code></td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                    <td className="text-secondary">{o.payment_method} / {o.payment_status}</td>
                    <td><strong>₹{o.subtotal}</strong></td>
                    <td className="text-secondary">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">Details →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
