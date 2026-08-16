import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { sellerApi } from "../api/seller";

const SAMPLE = `[
  {"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "price": "299.00", "stock": 10},
  {"title": "1984", "author": "George Orwell", "price": "249.00", "stock": 15},
  {"title": "To Kill a Mockingbird", "author": "Harper Lee", "price": "319.00", "stock": 8}
]`;

export function BulkBooks() {
  const navigate = useNavigate();
  const [json, setJson] = useState(SAMPLE);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const books = JSON.parse(json);
      if (!Array.isArray(books)) throw new Error("JSON must be an array of book objects");
      const res = await sellerApi.bulkCreateBooks(books);
      setMessage(`Successfully created ${res.count} books.`);
      setTimeout(() => navigate("/books"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Bulk add books" subtitle="Upload up to 50 books at once via JSON" />
      <div className="page-body">
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <p className="text-secondary" style={{ marginBottom: "1rem" }}>
            Each object needs: <code>title</code>, <code>author</code>, <code>price</code>, <code>stock</code>. Optional: <code>isbn</code>, <code>description</code>.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>JSON array</label>
              <textarea
                rows={14}
                value={json}
                onChange={(e) => setJson(e.target.value)}
                style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }}
              />
            </div>
            <div className="page-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Creating…" : "Create books"}
              </button>
              <Link to="/books" className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
