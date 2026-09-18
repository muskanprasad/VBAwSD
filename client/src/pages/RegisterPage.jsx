// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signup } from "../api/authApi";
import { enrollVoice } from "../api/voiceApi";
import AudioRecorder from "../components/audio/AudioRecorder";
import ThemeToggle from "../components/common/ThemeToggle";

const RegisterPage = () => {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
  });

  const [numSamples, setNumSamples] = useState(0);
  const [status, setStatus] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setStatus("");
    setSignupLoading(true);
    try {
      await signup(form);
      setStatus("✅ Account created. You can now log in and enroll your voice.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error creating user (maybe username already exists).");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleRecorded = async (blob) => {
    if (!blob) return;
    setEnrollLoading(true);
    try {
      setStatus("🎙 Uploading live recording for enrollment...");
      const res = await enrollVoice(blob);
      const total = res.data.numSamples || 0;
      setNumSamples(total);

      const spoof = res.data.spoofScore;
      const spoofStr =
        typeof spoof === "number" ? ` (spoofScore = ${spoof.toFixed(2)})` : "";

      setStatus(`✅ Sample saved. Total samples: ${total}${spoofStr}`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error during voice enrollment. Are you logged in?");
    } finally {
      setEnrollLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card app-card-wide">
        {/* HEADER BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "0.75rem",
            alignItems: "center",
          }}
        >
          <div>
            <div className="app-title">Create your VoiceAuth account</div>
            <div className="app-subtitle">
              Register with basic details and optionally enroll your voice samples right away.
            </div>
          </div>

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
          </div>
        </div>

        {/* MAIN CONTENT: TWO COLUMNS */}
        <div className="app-row">
          {/* LEFT: ACCOUNT DETAILS */}
          <div className="app-card" style={{ padding: "1.2rem" }}>
            <div className="app-section-title">Account details</div>
            <div className="app-section-subtitle">
              Choose a unique username and a strong password. You’ll use these along with
              your voice to log in.
            </div>

            <form onSubmit={handleSignup} style={{ marginTop: "0.9rem" }}>
              <div className="app-field">
                <label className="app-label">Full name</label>
                <input
                  className="app-input"
                  name="fullName"
                  placeholder="e.g. Muskan Prasad"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="app-field">
                <label className="app-label">Username</label>
                <input
                  className="app-input"
                  name="username"
                  placeholder="Pick a username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="app-field">
                <label className="app-label">Password</label>
                <input
                  className="app-input"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="app-btn app-btn-primary"
                disabled={signupLoading}
              >
                {signupLoading ? "Creating account..." : "Create account"}
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
                Already have an account?
              </span>
              <Link to="/login" className="app-link">
                Go to login
              </Link>
            </div>
          </div>

          {/* RIGHT: LIVE VOICE ENROLLMENT */}
          <div className="app-card" style={{ padding: "1.2rem" }}>
            <div className="app-section-title">Live voice enrollment</div>
            <div className="app-section-subtitle">
              Record short 2–4 second phrases in a quiet environment. Multiple samples help
              the model learn your voice better.
            </div>

            <div
              style={{
                marginTop: "0.9rem",
                fontSize: "0.9rem",
                padding: "0.8rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(148,163,184,0.22)",
                background:
                  document.documentElement.getAttribute("data-theme") === "light"
                    ? "rgba(99,102,241,0.08)" // pale lavender in light mode
                    : "rgba(255,255,255,0.06)", // pale glassy box in dark mode
                backdropFilter: "blur(6px)",
              }}
            >
              <div style={{ marginBottom: "0.35rem" }}>
                <strong>Recorded samples:</strong> {numSamples}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Tip: enroll at least 3–5 samples for more stable verification.
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <AudioRecorder onRecorded={handleRecorded} disabled={enrollLoading} />
            </div>

            {status && (
              <div
                style={{
                  marginTop: "0.9rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  whiteSpace: "pre-line",
                }}
              >
                {enrollLoading ? "Processing audio..." : status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;


// import React, { useState } from "react";
// import { registerUser } from "../api/authApi";
// import AudioRecorder from "../components/audio/AudioRecorder";
// import "../styles/RegisterPage.css";

// export default function RegisterPage() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });

//   const [step, setStep] = useState(1); 
//   // 1 = details, 2 = voice enroll, 3 = success

//   const [status, setStatus] = useState("idle");
//   const [error, setError] = useState("");

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleDetailsSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await registerUser(form);
//       setStep(2);
//     } catch (err) {
//       setError("Registration failed");
//     }
//   };

//   const handleEnrollResult = (result) => {
//     if (result?.decision === "ACCEPT") {
//       setStep(3);
//     } else {
//       setError("Voice enrollment failed. Try again.");
//       setStatus("error");
//     }
//   };

//   return (
//     <div className="register-page">
//       <div className="register-card">
//         <h1>Create your VoiceAuth account</h1>

//         {/* STEP 1 */}
//         {step === 1 && (
//           <form onSubmit={handleDetailsSubmit} className="form">
//             <input
//               name="name"
//               placeholder="Full Name"
//               value={form.name}
//               onChange={handleChange}
//               required
//             />
//             <input
//               name="email"
//               type="email"
//               placeholder="Email"
//               value={form.email}
//               onChange={handleChange}
//               required
//             />
//             <input
//               name="password"
//               type="password"
//               placeholder="Password"
//               value={form.password}
//               onChange={handleChange}
//               required
//             />

//             <button type="submit">Continue to Voice Enrollment</button>
//           </form>
//         )}

//         {/* STEP 2 */}
//         {step === 2 && (
//           <>
//             <p className="subtitle">
//               Record your voice to enroll your biometric identity
//             </p>

//             <AudioRecorder
//               onRecordingStart={() => setStatus("recording")}
//               onRecordingStop={() => setStatus("verifying")}
//               onResult={handleEnrollResult}
//             />

//             {status === "recording" && (
//               <p className="status recording">🎙️ Recording voice…</p>
//             )}

//             {status === "verifying" && (
//               <p className="status verifying">🔐 Enrolling voice…</p>
//             )}

//             {error && <p className="status error">{error}</p>}
//           </>
//         )}

//         {/* STEP 3 */}
//         {step === 3 && (
//           <div className="success">
//             <h2>✅ Enrollment Complete</h2>
//             <p>Your voice has been securely registered.</p>
//             <a href="/login">Go to Login</a>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
