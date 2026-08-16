import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconCart, IconOrders, IconShop } from "./Icons";

const LANDING_URL = import.meta.env.VITE_LANDING_URL || "http://localhost:5172";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link${isActive ? " active" : ""}`;

  return (
    <div className="app-shell buyer-app theme-buyer">
      <aside className="sidebar">
        <a href={LANDING_URL} className="sidebar-brand">
          <span className="sidebar-brand-icon">📚</span>
          <div>
            <div className="sidebar-brand-text">BookVerse</div>
            <div className="sidebar-brand-badge" style={{ color: "#c4b5fd" }}>Buyer</div>
          </div>
        </a>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={navClass}>
            <IconShop /> Catalog
          </NavLink>
          <NavLink to="/cart" className={navClass}>
            <IconCart /> Cart
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            <IconOrders /> My Orders
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
        <Outlet />
      </div>
    </div>
  );
}
