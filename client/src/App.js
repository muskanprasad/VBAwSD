// client/src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import AuthPage from "./components/AuthPage";
import UserDashboard from "./components/UserDashboard";
import AdminRoutes from "./components/AdminRoutes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin" element={<AdminRoutes />} />

      {/* Fallback route */}
      <Route path="*" element={<div style={{padding:20}}>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
