import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { sellerApi } from "../api/seller";

export function BookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    title: "", author: "", isbn: "", description: "", price: "", stock: "0", status: "active",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      sellerApi.listBooks().then((r) => {
        const book = r.books.find((b) => b.id === id);
        if (book) {
          setForm({
            title: book.title, author: book.author, isbn: book.isbn || "",
            description: book.description || "", price: book.price,
            stock: String(book.stock), status: book.status,
          });
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      title: form.title, author: form.author, isbn: form.isbn || null,
      description: form.description || null, price: form.price,
      stock: parseInt(form.stock, 10), ...(isEdit ? { status: form.status } : {}),
    };
    try {
      if (isEdit && id) await sellerApi.updateBook(id, payload);
      else await sellerApi.createBook(payload);
      navigate("/books");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title={isEdit ? "Edit book" : "Add book"} subtitle={isEdit ? "Update listing details" : "Create a new listing"} />
      <div className="page-body">
        <div className="card form-card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>ISBN <span className="muted">(optional)</span></label>
              <input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
            </div>
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            <div className="page-actions" style={{ marginTop: "1.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving…" : "Save book"}
              </button>
              <Link to="/books" className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
