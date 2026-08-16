import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { sellerApi } from "../api/seller";
import type { SellerRating } from "@shared/types";

export function Reviews() {
  const [reviews, setReviews] = useState<SellerRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerApi.getReviews().then((r) => {
      setReviews(r.reviews);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading-screen">Loading…</div>;

  return (
    <>
      <PageHeader title="My Reviews" subtitle="See what buyers are saying about your service" />
      <div className="page-body">
        {reviews.length === 0 ? (
          <div className="card">
            <p>No reviews yet. When buyers rate you, they'll appear here.</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviews.map((review) => (
                <div key={review.id} style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <strong>{review.buyer?.first_name} {review.buyer?.last_name}</strong>
                    <span style={{ color: "var(--accent)", fontSize: "1.25rem" }}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                  </div>
                  {review.comment && <p style={{ margin: 0, color: "var(--text-secondary)" }}>{review.comment}</p>}
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
