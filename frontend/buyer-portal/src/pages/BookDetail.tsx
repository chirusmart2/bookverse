import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { buyerApi } from "../api/buyer";
import type { Book, SellerRating } from "@shared/types";

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<SellerRating[]>([]);

  useEffect(() => {
    if (id) {
      buyerApi.getBook(id).then((r) => {
        setBook(r.book);
        if (r.book.seller_id) {
          buyerApi.getSellerReviews(r.book.seller_id).then((rev) => setReviews(rev.reviews));
        }
      });
    }
  }, [id]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      await buyerApi.addToCart(id, quantity);
      setMessage("Added to cart!");
      setTimeout(() => navigate("/cart"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setLoading(false);
    }
  };

  if (!book) return <div className="loading-screen">Loading…</div>;

  return (
    <>
      <PageHeader title={book.title} subtitle={`by ${book.author}`} />
      <div className="page-body">
        <Link to="/" className="auth-back-link" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          ← Back to catalog
        </Link>

        <div className="card" style={{ display: "grid", gridTemplateColumns: "minmax(200px, 280px) 1fr", gap: "2rem", alignItems: "start" }}>
          <div className="book-card-cover" style={{ height: 320, borderRadius: "var(--radius-lg)", fontSize: "5rem" }}>📖</div>
          <div>
            {book.seller_name && <p className="muted" style={{ marginBottom: "0.5rem" }}>Sold by {book.seller_name}</p>}
            <p className="book-card-price" style={{ fontSize: "2rem", marginBottom: "1rem" }}>₹{book.price}</p>
            <p className="text-secondary" style={{ marginBottom: "1.5rem", lineHeight: 1.7 }}>
              {book.description || "No description provided."}
            </p>
            <p style={{ marginBottom: "1.5rem" }}><strong>{book.stock}</strong> copies available</p>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleAdd} className="page-actions">
              <div className="form-group" style={{ marginBottom: 0, maxWidth: 120 }}>
                <label>Quantity</label>
                <input type="number" min={1} max={book.stock} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ alignSelf: "flex-end" }}>
                {loading ? "Adding…" : "Add to cart"}
              </button>
            </form>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="card" style={{ marginTop: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>Seller Reviews</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviews.map((review) => (
                <div key={review.id} style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <strong>{review.buyer?.first_name} {review.buyer?.last_name}</strong>
                    <span style={{ color: "var(--accent)" }}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
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
