import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { buyerApi } from "../api/buyer";
import type { Book } from "@shared/types";

export function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (search?: string) => {
    setLoading(true);
    buyerApi.listBooks({ q: search || undefined }).then((r) => {
      setBooks(r.books);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(q);
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
      </div>
    </>
  );
}
