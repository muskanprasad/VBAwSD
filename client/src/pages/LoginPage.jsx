// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../api/authApi";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // loginApi returns response.data
      const data = await loginApi({ username, password });

      // support multiple shapes:
      // 1) { token, user: { username, role } }
      // 2) { token, role, username }
      // 3) custom -> try to infer

      let token = data.token || data.accessToken || null;
      let userObj = data.user || null;
      let role = data.role || (userObj && userObj.role) || null;
      let uname = (userObj && userObj.username) || data.username || username;

      if (!token) {
        // maybe backend returned { success, token: null, message }
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // call context login
      login({
        token,
        role: role || "user",
        username: uname,
      });

      // redirect based on role
      if ((role || (userObj && userObj.role)) === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    } catch (err) {
      console.error("login error", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="app-title">VoiceAuth Portal</div>
        <div className="app-subtitle">
          Secure login with AI-based voice biometric authentication.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="app-field">
            <label className="app-label">Username</label>
            <input
              className="app-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="app-field">
            <label className="app-label">Password</label>
            <input
              className="app-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "#fca5a5",
                marginBottom: "0.8rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="app-btn app-btn-primary"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8rem",
          }}
        >
          <span className="app-section-subtitle" style={{ marginBottom: 0 }}>
            New here?
          </span>
          <Link to="/register" className="app-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;






// import React, { useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import AudioRecorder from "../components/audio/AudioRecorder";
// import "../styles/LoginPage.css";

// export default function LoginPage() {
//   const { login } = useAuth();
//   const [status, setStatus] = useState("idle"); // idle | recording | verifying | success | error
//   const [error, setError] = useState("");

//   const handleVoiceSuccess = async (result) => {
//     try {
//       setStatus("verifying");

//       if (result.decision === "ACCEPT") {
//         login(result); // keep your existing login logic
//         setStatus("success");
//       } else {
//         setError(result.reason || "Voice not recognized");
//         setStatus("error");
//       }
//     } catch (err) {
//       setError("Verification failed");
//       setStatus("error");
//     }
//   };

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         {/* LEFT */}
//         <div className="login-left">
//           <h1 className="brand">VoiceAuth</h1>
//           <p className="tagline">
//             Secure authentication using <span>voice biometrics</span>
//           </p>

//           <ul className="features">
//             <li>✔ Speaker verification</li>
//             <li>✔ Anti-spoof protection</li>
//             <li>✔ Z-score normalized decisions</li>
//           </ul>
//         </div>

//         {/* RIGHT */}
//         <div className="login-right">
//           <h2>Voice Login</h2>
//           <p className="subtitle">
//             Speak naturally to verify your identity
//           </p>

//           <AudioRecorder
//             onRecordingStart={() => setStatus("recording")}
//             onRecordingStop={() => setStatus("verifying")}
//             onResult={handleVoiceSuccess}
//           />

//           {status === "recording" && (
//             <p className="status recording">🎙️ Listening…</p>
//           )}

//           {status === "verifying" && (
//             <p className="status verifying">🔐 Verifying voice…</p>
//           )}

//           {status === "success" && (
//             <p className="status success">✅ Verified successfully</p>
//           )}

//           {status === "error" && (
//             <p className="status error">❌ {error}</p>
//           )}

//           <div className="divider">OR</div>

//           <button className="password-btn" disabled>
//             Login with password (disabled for demo)
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

