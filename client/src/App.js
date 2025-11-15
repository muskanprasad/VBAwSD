// client/src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import AuthPage from "./components/AuthPage";
import UserDashboard from "./components/UserDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminRoutes"; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
