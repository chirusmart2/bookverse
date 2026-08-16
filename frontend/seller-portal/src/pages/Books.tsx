import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { sellerApi } from "../api/seller";
import type { Book } from "@shared/types";

export function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [counts, setCounts] = useState<{ active: number; inactive: number; total: number } | null>(null);

  const load = () => {
    sellerApi.listBooks({ status: statusFilter || undefined }).then((r) => {
      setBooks(r.books);
      setCounts(r.counts);
    });
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this book? It will be hidden from the catalog.")) return;
    await sellerApi.deleteBook(id);
    load();
  };

  return (
    <>
      <PageHeader title="My Books" subtitle="Manage your catalog and inventory" />
      <div className="page-body">
        <div className="toolbar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="page-actions">
            <Link to="/books/bulk" className="btn btn-secondary">Bulk add</Link>
            <Link to="/books/new" className="btn btn-primary">Add book</Link>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="empty-state card">
            {counts && counts.total === 0 ? (
              <>
                <p>No books in your catalog yet.</p>
                <Link to="/books/new" className="btn btn-primary">Add your first book</Link>
              </>
            ) : (
              <p>No {statusFilter || "books"} in this view.</p>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.title}</strong></td>
                    <td className="text-secondary">{b.author}</td>
                    <td>₹{b.price}</td>
                    <td>{b.stock}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      <Link to={`/books/${b.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                      {b.status === "active" && (
                        <button type="button" className="link-btn" onClick={() => deactivate(b.id)}>Deactivate</button>
                      )}
                    </td>
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
