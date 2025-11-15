import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Icon = ({ children }) => <div className="icon">{children}</div>;

export default function Sidebar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("va_token");
    localStorage.removeItem("va_role");
    localStorage.removeItem("va_user");
    navigate("/login");
  };

  return (
    <aside className="sidebar compact">
      <div className="brand-compact">
        <div className="brand-icon">🎙</div>
      </div>

      <nav className="nav">
        <NavLink to="/admin" end className="nav-item" title="Dashboard">
          <Icon>🏠</Icon>
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink to="/admin/users" className="nav-item" title="Users">
          <Icon>👥</Icon>
          <span className="nav-text">Users</span>
        </NavLink>

        <NavLink to="/admin/audio" className="nav-item" title="Audio">
          <Icon>🔊</Icon>
          <span className="nav-text">Audio</span>
        </NavLink>

        <NavLink to="/admin/settings" className="nav-item" title="Settings">
          <Icon>⚙️</Icon>
          <span className="nav-text">Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  );
}
