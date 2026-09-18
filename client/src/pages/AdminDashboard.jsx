// src/pages/AdminDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { username, logout } = useAuth();

  const displayName = username || "admin";

  const [users] = useState([
    { username: "muskan", role: "admin", numSamples: 5 },
    { username: "user1", role: "user", numSamples: 3 },
    { username: "user2", role: "user", numSamples: 0 },
  ]);

  const [attempts] = useState([
    {
      id: 1,
      username: "muskan",
      type: "VERIFY",
      success: true,
      similarity: 0.94,
      spoofScore: 0.22,
      timestamp: "2025-11-27 21:10",
    },
    {
      id: 2,
      username: "user1",
      type: "VERIFY",
      success: false,
      similarity: 0.58,
      spoofScore: 0.78,
      timestamp: "2025-11-27 21:05",
    },
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isLightTheme =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "light";

  return (
    <div
      className="app-shell"
      style={{
        alignItems: "flex-start",
        paddingTop: "2.5rem",
        paddingBottom: "2.5rem",
      }}
    >
      <div className="app-card app-card-wide">
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 220px" }}>
            <div className="app-title">Admin Control Center</div>
            <div className="app-subtitle">
              Monitor users, voice enrollments, and authentication attempts.
            </div>
          </div>

          {/* RIGHT SIDE: theme + user + logout */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.75rem",
              paddingRight: "0.5rem",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <ThemeToggle />

            <span
              style={{
                padding: "6px 12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                fontSize: "0.8rem",
                color: "var(--text-main)",
                backdropFilter: "blur(4px)",
                whiteSpace: "nowrap",
              }}
            >
              Admin: <strong>{displayName}</strong>
            </span>

            <button
              onClick={handleLogout}
              style={{
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                background: "rgba(239,68,68,0.18)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#fca5a5",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.3)";
                e.currentTarget.style.border =
                  "1px solid rgba(239,68,68,0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.18)";
                e.currentTarget.style.border =
                  "1px solid rgba(239,68,68,0.35)";
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="app-row">
          <div className="app-card" style={{ padding: "1.1rem" }}>
            <div className="app-section-title">Total Users</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
              {users.length}
            </div>
            <div className="app-section-subtitle">
              {users.filter((u) => u.numSamples > 0).length} have enrolled
              voiceprints
            </div>
          </div>

          <div className="app-card" style={{ padding: "1.1rem" }}>
            <div className="app-section-title">Recent Attempts</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
              {attempts.length}
            </div>
            <div className="app-section-subtitle">
              {attempts.filter((a) => a.success).length} successful,{" "}
              {attempts.filter((a) => !a.success).length} rejected
            </div>
          </div>

          <div className="app-card" style={{ padding: "1.1rem" }}>
            <div className="app-section-title">Spoof Alerts</div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "var(--accent-danger)",
              }}
            >
              {attempts.filter((a) => a.spoofScore > 0.7).length}
            </div>
            <div className="app-section-subtitle">
              Attempts with high spoof score
            </div>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="app-card" style={{ padding: "1.3rem" }}>
          <div className="app-section-title">Registered Users</div>
          <div className="app-section-subtitle">
            View all users and their enrollment status.
          </div>
          <div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Voice Samples</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const enrolled = u.numSamples > 0;
                  return (
                    <tr key={u.username}>
                      <td data-label="Username">{u.username}</td>
                      <td data-label="Role">
                        <span className="badge">{u.role}</span>
                      </td>
                      <td data-label="Voice Samples">{u.numSamples}</td>
                      <td data-label="Status">
                        {enrolled ? (
                          <span className="badge badge-success">Enrolled</span>
                        ) : (
                          <span className="badge badge-danger">
                            Not Enrolled
                          </span>
                        )}
                      </td>
                      <td data-label="Actions">
                        <div
                          style={{
                            display: "flex",
                            gap: "0.4rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="app-btn app-btn-sm app-btn-secondary"
                            disabled
                            style={{
                              cursor: "default",
                              opacity: 0.9,
                              padding: "0.4rem 0.9rem",
                              borderRadius: "999px",
                              background: isLightTheme
  ? "rgba(99,102,241,0.10)"       // soft lavender tint (matches your theme)
  : "rgba(15,23,42,0.85)",        // keep dark mode
border: isLightTheme
  ? "1px solid rgba(99,102,241,0.25)" // subtle purple border
  : "1px solid rgba(148,163,184,0.35)",
color: isLightTheme
  ? "#4b5563"                     // dark grey readable text
  : "var(--text-muted)",

                            }}
                          >
                            View logs
                          </button>
                          <button
                            className="app-btn app-btn-sm app-btn-secondary"
                            disabled
                            style={{
                              cursor: "default",
                              opacity: 0.9,
                              padding: "0.4rem 0.9rem",
                              borderRadius: "999px",
                              background: isLightTheme
                                ? "rgba(148,163,184,0.16)"
                                : "rgba(15,23,42,0.85)",
                              border: isLightTheme
                                ? "1px solid rgba(148,163,184,0.45)"
                                : "1px solid rgba(148,163,184,0.35)",
                              color: isLightTheme
                                ? "#4b5563"
                                : "var(--text-muted)",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ATTEMPTS TABLE */}
        <div className="app-card" style={{ padding: "1.3rem" }}>
          <div className="app-section-title">
            Recent Authentication Attempts
          </div>
          <div className="app-section-subtitle">
            Sample data (we can wire backend logs later).
          </div>
          <div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Result</th>
                  <th>Similarity</th>
                  <th>Spoof Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td data-label="User">{a.username}</td>
                    <td data-label="Type">{a.type}</td>
                    <td data-label="Result">
                      {a.success ? (
                        <span className="badge badge-success">ACCEPT</span>
                      ) : (
                        <span className="badge badge-danger">REJECT</span>
                      )}
                    </td>
                    <td data-label="Similarity">
                      {a.similarity.toFixed(2)}
                    </td>
                    <td data-label="Spoof Score">
                      {a.spoofScore.toFixed(2)}
                    </td>
                    <td data-label="Time">{a.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


// import React from "react";
// import "../styles/AdminDashboard.css";

// export default function AdminDashboard() {
//   // These are frozen values from your evaluation
//   const metrics = {
//     similarityThreshold: 0.96,
//     zThreshold: 1.1,
//     spoofThreshold: 0.5,
//     far: 0.0,
//     frr: 0.0,
//     eer: "≈ 0.0",
//   };

//   return (
//     <div className="admin-page">
//       <div className="admin-card">
//         <h1>Admin Security Dashboard</h1>
//         <p className="subtitle">
//           Voice Biometric System Evaluation Summary
//         </p>

//         <div className="section">
//           <h2>Threshold Configuration</h2>

//           <div className="row">
//             <span>Similarity Threshold</span>
//             <strong>{metrics.similarityThreshold}</strong>
//           </div>

//           <div className="row">
//             <span>Z-Score Threshold</span>
//             <strong>{metrics.zThreshold}</strong>
//           </div>

//           <div className="row">
//             <span>Spoof Threshold</span>
//             <strong>{metrics.spoofThreshold}</strong>
//           </div>
//         </div>

//         <div className="section">
//           <h2>Security Metrics</h2>

//           <div className="row">
//             <span>False Acceptance Rate (FAR)</span>
//             <strong>{metrics.far}</strong>
//           </div>

//           <div className="row">
//             <span>False Rejection Rate (FRR)</span>
//             <strong>{metrics.frr}</strong>
//           </div>

//           <div className="row">
//             <span>Equal Error Rate (EER)</span>
//             <strong>{metrics.eer}</strong>
//           </div>
//         </div>

//         <div className="section note">
//           <p>
//             ✔ System evaluated using multiple speakers <br />
//             ✔ Z-score normalization for robustness <br />
//             ✔ Anti-spoof detection enabled <br />
//             ✔ Thresholds frozen after evaluation
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
