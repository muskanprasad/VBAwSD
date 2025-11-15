import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-root">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
