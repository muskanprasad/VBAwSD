// src/pages/UserDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AudioRecorder from "../components/audio/AudioRecorder";
import ThemeToggle from "../components/common/ThemeToggle";
import { enrollVoice, verifyVoice } from "../api/voiceApi";

const UserDashboard = () => {
  const { username, logout, token } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("enroll"); // "enroll" | "verify"
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null); // { decision, similarity, spoofScore, reason }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAudioRecorded = async (audioBlob) => {
    try {
      setLoading(true);
      setStatus(mode === "enroll" ? "Enrolling voice sample..." : "Verifying voice...");
      setResult(null);

      if (mode === "enroll") {
        // Use unified API
        const data = await enrollVoice(audioBlob);
        // data expected to contain numSamples, spoofScore, similarity etc.

        setStatus((data && data.message) || "Voice sample enrolled successfully.");
        setResult({
          decision: "ENROLLED",
          similarity: data?.similarity ?? null,
          spoofScore: data?.spoofScore ?? null,
          reason: data?.reason || "",
        });
        return;
      }

      // VERIFY mode
      const verifyRes = await verifyVoice(audioBlob);
      // verifyRes expected to contain success/decision/similarity/spoofScore/reason
      setResult({
        decision: verifyRes?.decision || (verifyRes?.success ? "ACCEPT" : "REJECT"),
        similarity: verifyRes?.similarity ?? null,
        spoofScore: verifyRes?.spoofScore ?? null,
        reason: verifyRes?.reason || "",
      });

      if (!verifyRes || verifyRes.success === false) {
        setStatus(verifyRes?.reason || "Verification failed");
      } else {
        setStatus("Verification complete.");
      }
    } catch (err) {
      console.error("[ERROR] handleAudioRecorded", err);
      setStatus(
        err?.response?.data?.message ||
          err?.message ||
          "Error during voice operation."
      );
    } finally {
      setLoading(false);
    }
  };

  const isEnroll = mode === "enroll";

  return (
    <div className="app-shell">
      <div className="app-card app-card-wide">
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "0.5rem",
            alignItems: "center",
          }}
        >
          <div>
            <div className="app-title">User Voice Dashboard</div>
            <div className="app-subtitle">
              Enroll your voice and verify identity using AI-based voice biometrics.
            </div>
          </div>

          {/* RIGHT: theme + user + logout */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.75rem",
              paddingRight: "0.5rem",
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
              }}
            >
              Signed in as: <strong>{username}</strong>
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
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.3)";
                e.currentTarget.style.border = "1px solid rgba(239,68,68,0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.18)";
                e.currentTarget.style.border = "1px solid rgba(239,68,68,0.35)";
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* MODE TOGGLE */}
        <div className="app-card" style={{ padding: "1rem", marginBottom: "0.5rem" }}>
          <div className="app-section-title">Mode</div>
          <div className="app-section-subtitle">
            Switch between enrollment (register your voice) and verification (authenticate).
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="app-btn app-btn-sm"
              style={{
                background: isEnroll
                  ? "linear-gradient(135deg,var(--accent),var(--accent-soft))"
                  : "rgba(15,23,42,0.9)",
                color: isEnroll ? "#fff" : "var(--text-main)",
                border: "1px solid rgba(148,163,184,0.4)",
              }}
              onClick={() => setMode("enroll")}
            >
              Enrollment Mode
            </button>
            <button
              className="app-btn app-btn-sm"
              style={{
                background: !isEnroll
                  ? "linear-gradient(135deg,var(--accent),var(--accent-soft))"
                  : "rgba(15,23,42,0.9)",
                color: !isEnroll ? "#fff" : "var(--text-main)",
                border: "1px solid rgba(148,163,184,0.4)",
              }}
              onClick={() => setMode("verify")}
            >
              Verification Mode
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="app-row">
          <div className="app-card" style={{ padding: "1.2rem" }}>
            <div className="app-section-title">
              {isEnroll ? "Enroll Voice Sample" : "Live Voice Verification"}
            </div>
            <div className="app-section-subtitle">
              {isEnroll
                ? "Record a short 2–4 second phrase in a quiet place. You can enroll multiple samples."
                : "Use this after enrolling to verify your identity using your voice."}
            </div>

            <AudioRecorder onRecorded={handleAudioRecorded} disabled={loading} />

            {status && (
              <div
                style={{
                  marginTop: "0.8rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}
              >
                {loading ? "Processing..." : status}
              </div>
            )}
          </div>

          <div className="app-card" style={{ padding: "1.2rem" }}>
            <div className="app-section-title">Analysis Result</div>
            <div className="app-section-subtitle">
              Decision, similarity score, and spoof indication for the last operation.
            </div>

            {result ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Decision</span>
                  <div style={{ marginTop: "0.2rem" }}>
                    {result.decision === "ACCEPT" || result.decision === "ENROLLED" ? (
                      <span className="badge badge-success">{result.decision}</span>
                    ) : (
                      <span className="badge badge-danger">
                        {result.decision || "REJECT"}
                      </span>
                    )}
                  </div>
                </div>

                {typeof result.similarity === "number" && (
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Similarity
                    </span>
                    <div style={{ marginTop: "0.2rem", fontSize: "0.95rem" }}>
                      {result.similarity.toFixed(3)}
                    </div>
                  </div>
                )}

                {typeof result.spoofScore === "number" && (
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Spoof score
                    </span>
                    <div style={{ marginTop: "0.2rem", fontSize: "0.95rem" }}>
                      {result.spoofScore.toFixed(3)}{" "}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        (higher = more likely spoof)
                      </span>
                    </div>
                  </div>
                )}

                {result.reason && (
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Reason
                    </span>
                    <div style={{ marginTop: "0.2rem", fontSize: "0.85rem" }}>
                      {result.reason}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                No analysis yet. Enroll or verify your voice to see results here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;


// import React from "react";
// import { useAuth } from "../context/AuthContext";
// import "../styles/UserDashboard.css";

// export default function UserDashboard() {
//   const { user } = useAuth();

//   // These values typically come from last /ai/verify response
//   // Safe fallback values for demo
//   const verification = user?.verification || {
//     similarity: 0.97,
//     zScore: 1.4,
//     spoofScore: 0.02,
//     decision: "ACCEPT",
//   };

//   return (
//     <div className="dashboard-page">
//       <div className="dashboard-card">
//         <h1>Welcome back 👋</h1>
//         <p className="email">{user?.email}</p>

//         <div className="result-card">
//           <h2>Last Voice Authentication</h2>

//           <div className="metric">
//             <span>Similarity Score</span>
//             <strong>{verification.similarity}</strong>
//           </div>

//           <div className="metric">
//             <span>Z-Score</span>
//             <strong>{verification.zScore}</strong>
//           </div>

//           <div className="metric">
//             <span>Spoof Score</span>
//             <strong>{verification.spoofScore}</strong>
//           </div>

//           <div
//             className={`decision ${
//               verification.decision === "ACCEPT"
//                 ? "accept"
//                 : "reject"
//             }`}
//           >
//             {verification.decision}
//           </div>
//         </div>

//         <div className="security-badge">
//           🔐 Anti-Spoof Protection Enabled
//         </div>
//       </div>
//     </div>
//   );
// }

