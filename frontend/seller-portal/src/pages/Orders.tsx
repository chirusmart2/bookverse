import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { sellerApi } from "../api/seller";
import type { Order } from "@shared/types";

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    sellerApi.listOrders({ status: statusFilter || undefined }).then((r) => setOrders(r.orders));
  }, [statusFilter]);

  return (
    <>
      <PageHeader title="Orders" subtitle="Manage incoming customer orders" />
      <div className="page-body">
        <div className="toolbar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state card"><p>No orders yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><code style={{ fontSize: "0.85rem" }}>{o.id.slice(0, 8)}…</code></td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                    <td><strong>₹{o.subtotal}</strong></td>
                    <td className="text-secondary">{new Date(o.created_at).toLocaleString()}</td>
                    <td><Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">Manage →</Link></td>
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
