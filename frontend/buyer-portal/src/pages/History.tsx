import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buyerApi } from "../api/buyer";
import { PageHeader } from "../components/PageHeader";
import type { Book } from "@shared/types";

type HistoryItem = { book: Book; viewed_at: string; views: number };

export function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    buyerApi.listHistory()
      .then((response) => setItems(response.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load your history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Recently viewed" subtitle="Books you have opened" />
      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <div className="loading-screen">Loading history…</div>
        ) : items.length === 0 ? (
          <div className="empty-state card">
            <p>No recently viewed books.</p>
            <Link to="/" className="btn btn-primary">Browse books</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Book</th><th>Seller</th><th>Price</th><th>Last viewed</th><th>Views</th></tr>
              </thead>
              <tbody>
                {items.map(({ book, viewed_at, views }) => (
                  <tr key={book.id}>
                    <td><Link to={`/books/${book.id}`}>{book.title}</Link><div className="text-secondary">by {book.author}</div></td>
                    <td className="text-secondary">{book.seller_name || "BookVerse seller"}</td>
                    <td><strong>₹{book.price}</strong></td>
                    <td className="text-secondary">{new Date(viewed_at).toLocaleString()}</td>
                    <td className="text-secondary">{views}</td>
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
