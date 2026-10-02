import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { buyerApi } from "../api/buyer";
import type { Book, PaginationMeta } from "@shared/types";

export function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState({ page: 1, query: "" });
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    buyerApi.listBooks({ page: request.page, q: request.query || undefined })
      .then((r) => {
        if (!active) return;
        setBooks(r.books);
        setMeta(r.meta);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load books.");
        setBooks([]);
        setMeta(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [request]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRequest({ page: 1, query: q.trim() });
  };

  const changePage = (page: number) => {
    setLoading(true);
    setError("");
    setRequest((current) => ({ ...current, page }));
  };

  return (
    <>
      <PageHeader title="Catalog" subtitle="Discover books from independent sellers" />
      <div className="page-body">
        <form className="search-bar" onSubmit={search}>
          <input placeholder="Search by title or author…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {loading ? (
          <div className="loading-screen">Loading books…</div>
        ) : error ? (
          <div className="alert alert-error" role="alert">{error}</div>
        ) : books.length === 0 ? (
          <div className="empty-state card">
            <p>No books found. Try a different search.</p>
          </div>
        ) : (
          <div className="book-grid">
            {books.map((b) => (
              <article key={b.id} className="book-card">
                <div className="book-card-cover">📖</div>
                <div className="book-card-body">
                  <h3>{b.title}</h3>
                  <p className="book-card-author">by {b.author}</p>
                  {b.seller_name && <p className="book-card-meta">Sold by {b.seller_name}</p>}
                  <p className="book-card-price">₹{b.price}</p>
                  <p className="book-card-meta">{b.stock} in stock</p>
                  <Link to={`/books/${b.id}`} className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && !error && meta && meta.total > 0 && (
          <div className="page-actions" style={{ justifyContent: "space-between", marginTop: "1.5rem" }}>
            <span className="text-secondary">
              Showing {(meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} books
            </span>
            <div className="page-actions">
              <button type="button" className="btn btn-secondary" onClick={() => changePage(meta.page - 1)} disabled={meta.page <= 1}>
                Previous
              </button>
              <span className="text-secondary">Page {meta.page} of {meta.pages}</span>
              <button type="button" className="btn btn-secondary" onClick={() => changePage(meta.page + 1)} disabled={meta.page >= meta.pages}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
