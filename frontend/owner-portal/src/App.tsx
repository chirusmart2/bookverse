import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiFetch, authApi } from "@shared/apiClient";
import { clearTokens, getRefreshToken, isAuthenticated, setTokens } from "@shared/auth";
import type { Book, User } from "@shared/types";

type Section = "overview" | "users" | "books" | "audit";
type DashboardStats = {
  users: { total: number; active: number };
  books: { total: number; active: number; inactive: number };
  orders: { total: number };
};
type PageMeta = { page: number; per_page: number; total: number; pages: number };
type OwnerUser = User & { is_active: boolean };
type OwnerBook = Book & { seller_name?: string; seller_email: string };
type AuditAction = {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, string | boolean>;
  created_at: string;
};

const blankStats: DashboardStats = {
  users: { total: 0, active: 0 },
  books: { total: 0, active: 0, inactive: 0 },
  orders: { total: 0 },
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(() => isAuthenticated());
  const [error, setError] = useState("");
  const [section, setSection] = useState<Section>("overview");

  useEffect(() => {
    if (!isAuthenticated()) return;
    apiFetch<{ owner: User }>("/owner/me")
      .then(({ owner }) => setUser(owner))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setError("");
    try {
      const result = await authApi.login(email.trim(), password);
      setTokens(result.access_token, result.refresh_token);
      const { owner } = await apiFetch<{ owner: User }>("/owner/me");
      setUser(owner);
    } catch (err) {
      clearTokens();
      setError(err instanceof Error && err.message.includes("Owner access")
        ? "This account is not enabled for owner access."
        : err instanceof Error ? err.message : "Sign in failed.");
    }
  };

  const handleLogout = async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try { await authApi.logout(refresh); } catch { /* token is cleared locally below */ }
    }
    clearTokens();
    setUser(null);
    setSection("overview");
  };

  if (checking) return <div className="owner-loading">Loading…</div>;
  if (!user) return <Login error={error} onLogin={handleLogin} />;

  return (
    <div className="owner-shell">
      <header className="owner-header">
        <a className="owner-brand" href="/" aria-label="BookVerse owner home">
          <span className="owner-mark">B</span>
          <span>BookVerse <small>OWNER</small></span>
        </a>
        <nav className="owner-nav" aria-label="Owner sections">
          {(["overview", "users", "books", "audit"] as Section[]).map((item) => (
            <button key={item} type="button" className={section === item ? "selected" : ""} onClick={() => setSection(item)}>
              {item === "overview" ? "Overview" : item === "users" ? "Accounts" : item === "books" ? "Books" : "Activity"}
            </button>
          ))}
        </nav>
        <div className="owner-identity">
          <span>{user.first_name} {user.last_name}</span>
          <button type="button" className="owner-signout" onClick={() => void handleLogout()}>Sign out</button>
        </div>
      </header>
      <main className="owner-main">
        {section === "overview" && <Overview />}
        {section === "users" && <Users />}
        {section === "books" && <Books />}
        {section === "audit" && <Audit />}
      </main>
    </div>
  );
}

function Login({ error, onLogin }: { error: string; onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try { await onLogin(email, password); } finally { setBusy(false); }
  };

  return (
    <main className="owner-login-wrap">
      <form className="owner-login" onSubmit={submit}>
        <div className="owner-mark owner-login-mark">B</div>
        <p className="owner-eyebrow">BookVerse / Owner</p>
        <h1>Owner sign in</h1>
        <label htmlFor="owner-email">Email</label>
        <input id="owner-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="owner-password">Password</label>
        <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="owner-error" role="alert">{error}</p>}
        <button className="owner-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}

function Overview() {
  const [stats, setStats] = useState(blankStats);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardStats>("/owner/dashboard").then(setStats).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <div className="owner-page-title"><div><p className="owner-eyebrow">Control room</p><h1>Overview</h1></div></div>
      {error && <p className="owner-error" role="alert">{error}</p>}
      <section className="owner-stats" aria-label="Marketplace totals">
        <Stat label="Accounts" value={stats.users.total} detail={`${stats.users.active} active`} />
        <Stat label="Books" value={stats.books.total} detail={`${stats.books.active} listed`} />
        <Stat label="Orders" value={stats.orders.total} detail="Across the marketplace" />
      </section>
      <p className="owner-note">Account suspension and book unlisting preserve order history. Every owner change is recorded in Activity.</p>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="owner-stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Users() {
  const [users, setUsers] = useState<OwnerUser[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), per_page: "50", q: search });
    apiFetch<{ users: OwnerUser[]; meta: PageMeta }>(`/owner/users?${params}`)
      .then((result) => {
        if (!active) return;
        setUsers(result.users);
        setMeta(result.meta);
        setError("");
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load accounts."); });
    return () => { active = false; };
  }, [search, page, reload]);

  const toggle = async (account: OwnerUser) => {
    const action = account.is_active ? "suspend" : "restore";
    if (!window.confirm(`${action === "suspend" ? "Suspend" : "Restore"} ${account.email}? Existing order history is retained.`)) return;
    try {
      await apiFetch(`/owner/users/${account.id}/status`, { method: "PATCH", body: JSON.stringify({ is_active: !account.is_active }) });
      setReload((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update account."); }
  };

  return (
    <>
      <div className="owner-page-title"><div><p className="owner-eyebrow">Marketplace access</p><h1>Accounts</h1></div></div>
      <form className="owner-search" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(query.trim()); }}>
        <input aria-label="Search accounts" placeholder="Search name or email" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="owner-secondary" type="submit">Search</button>
      </form>
      {error && <p className="owner-error" role="alert">{error}</p>}
      <DataTable headers={["Account", "Role", "Status", "Joined", ""]}>
        {users.map((account) => (
          <tr key={account.id}>
            <td><strong>{account.first_name} {account.last_name}</strong><small>{account.email}</small></td>
            <td className="owner-capitalize">{account.role}</td>
            <td><Status active={account.is_active} /></td>
            <td>{new Date(account.created_at).toLocaleDateString()}</td>
            <td><button className="owner-row-action" type="button" onClick={() => void toggle(account)}>{account.is_active ? "Suspend" : "Restore"}</button></td>
          </tr>
        ))}
        {!users.length && <EmptyRow columns={5} label="No accounts found" />}
      </DataTable>
      <p className="owner-table-meta">{meta?.total ?? 0} accounts</p>
      {meta && <Pagination page={page} pages={meta.pages} onChange={setPage} />}
    </>
  );
}

function Books() {
  const [books, setBooks] = useState<OwnerBook[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), per_page: "50", q: search });
    if (status) params.set("status", status);
    apiFetch<{ books: OwnerBook[]; meta: PageMeta }>(`/owner/books?${params}`)
      .then((result) => {
        if (!active) return;
        setBooks(result.books);
        setMeta(result.meta);
        setError("");
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load books."); });
    return () => { active = false; };
  }, [search, status, page, reload]);

  const toggle = async (book: OwnerBook) => {
    const status = book.status === "active" ? "inactive" : "active";
    if (status === "inactive" && !window.confirm(`Unlist “${book.title}”? Past orders will remain.`)) return;
    try {
      await apiFetch(`/owner/books/${book.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setReload((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update book."); }
  };

  return (
    <>
      <div className="owner-page-title"><div><p className="owner-eyebrow">Marketplace inventory</p><h1>Books</h1></div></div>
      <form className="owner-search" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(query.trim()); }}>
        <input aria-label="Search books" placeholder="Search title, author, or seller" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter books by status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="">All statuses</option><option value="active">Listed</option><option value="inactive">Unlisted</option>
        </select>
        <button className="owner-secondary" type="submit">Search</button>
      </form>
      {error && <p className="owner-error" role="alert">{error}</p>}
      <DataTable headers={["Book", "Seller", "Price", "Stock", "Status", ""]}>
        {books.map((book) => (
          <tr key={book.id}>
            <td><strong>{book.title}</strong><small>{book.author}</small></td>
            <td><strong>{book.seller_name || "Seller"}</strong><small>{book.seller_email}</small></td>
            <td>₹{book.price}</td>
            <td>{book.stock}</td>
            <td><Status active={book.status === "active"} activeLabel="Listed" inactiveLabel="Unlisted" /></td>
            <td><button className="owner-row-action" type="button" onClick={() => void toggle(book)}>{book.status === "active" ? "Unlist" : "Relist"}</button></td>
          </tr>
        ))}
        {!books.length && <EmptyRow columns={6} label="No books found" />}
      </DataTable>
      <p className="owner-table-meta">{meta?.total ?? 0} books</p>
      {meta && <Pagination page={page} pages={meta.pages} onChange={setPage} />}
    </>
  );
}

function Audit() {
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetch<{ actions: AuditAction[] }>("/owner/audit?per_page=50")
      .then((result) => setActions(result.actions))
      .catch((err) => setError(err.message));
  }, []);
  return (
    <>
      <div className="owner-page-title"><div><p className="owner-eyebrow">Owner changes</p><h1>Activity</h1></div></div>
      {error && <p className="owner-error" role="alert">{error}</p>}
      <DataTable headers={["Action", "Target", "Change", "Time"]}>
        {actions.map((action) => (
          <tr key={action.id}>
            <td>{action.action.replaceAll("_", " ")}</td>
            <td>{action.target_type} · {action.target_id.slice(0, 8)}</td>
            <td>{Object.entries(action.details).map(([key, value]) => `${key}: ${value}`).join(", ")}</td>
            <td>{new Date(action.created_at).toLocaleString()}</td>
          </tr>
        ))}
        {!actions.length && <EmptyRow columns={4} label="No owner changes yet" />}
      </DataTable>
    </>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="owner-table-wrap"><table className="owner-table"><thead><tr>{headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function EmptyRow({ columns, label }: { columns: number; label: string }) {
  return <tr><td className="owner-empty" colSpan={columns}>{label}</td></tr>;
}

function Status({ active, activeLabel = "Active", inactiveLabel = "Suspended" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return <span className={`owner-status${active ? " active" : ""}`}>{active ? activeLabel : inactiveLabel}</span>;
}

function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages < 2) return null;
  return (
    <div className="owner-pagination" aria-label="List pages">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
