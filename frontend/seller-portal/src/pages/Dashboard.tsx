import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { sellerApi } from "../api/seller";

const STATUS_LABELS: Record<string, string> = {
  placed: "New orders",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    sellerApi.dashboard().then((d) => setCounts(d.order_counts));
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your store performance" />
      <div className="page-body">
        <div className="stats-grid">
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} className="stat-card">
              <div className="stat-value">{count}</div>
              <div className="stat-label">{STATUS_LABELS[status] || status}</div>
            </div>
          ))}
        </div>
        <div className="toolbar">
          <h2 style={{ fontSize: "1.15rem" }}>Quick actions</h2>
        </div>
        <div className="page-actions">
          <Link to="/books/new" className="btn btn-primary">Add a book</Link>
          <Link to="/books/bulk" className="btn btn-secondary">Bulk upload</Link>
          <Link to="/orders" className="btn btn-secondary">View orders</Link>
        </div>
      </div>
    </>
  );
}
