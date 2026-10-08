import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-state";
import { IconBooks, IconDashboard, IconOrders, IconPlus, IconStack, IconStar } from "./Icons";

const LANDING_URL = import.meta.env.VITE_LANDING_URL || "http://localhost:5172";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link${isActive ? " active" : ""}`;

  return (
    <div className="app-shell seller-app-shell">
      {mobileNavOpen && (
        <button
          type="button"
          className="seller-mobile-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside id="seller-navigation" className={`sidebar${mobileNavOpen ? " mobile-open" : ""}`}>
        <a href={LANDING_URL} className="sidebar-brand">
          <span className="sidebar-brand-icon">📚</span>
          <div>
            <div className="sidebar-brand-text">BookVerse</div>
            <div className="sidebar-brand-badge">Seller</div>
          </div>
        </a>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={navClass} onClick={() => setMobileNavOpen(false)}>
            <IconDashboard /> Dashboard
          </NavLink>
          <NavLink to="/books" className={navClass} onClick={() => setMobileNavOpen(false)}>
            <IconBooks /> My Books
          </NavLink>
          <NavLink to="/books/new" className={navClass} onClick={() => setMobileNavOpen(false)}>
            <IconPlus /> Add Book
          </NavLink>
          <NavLink to="/books/bulk" className={navClass} onClick={() => setMobileNavOpen(false)}>
            <IconStack /> Bulk Add
          </NavLink>
          <NavLink to="/orders" className={navClass} onClick={() => setMobileNavOpen(false)}>
            <IconOrders /> Orders
          </NavLink>
          <NavLink to="/reviews" className={navClass} onClick={() => setMobileNavOpen(false)}>
            <IconStar /> Reviews
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
              <div className="sidebar-user-role">{user?.email}</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%", color: "#a8a29e" }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="seller-mobile-header">
          <a href={LANDING_URL} className="seller-mobile-brand">BookVerse <span>Seller</span></a>
          <button
            type="button"
            className="seller-mobile-menu"
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="seller-navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <IconMenuClose /> : <IconMenu />}
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconMenuClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
