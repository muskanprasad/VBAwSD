// UserDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../App.css";

const API_BASE = "http://localhost:5000";

export default function UserDashboard() {
  const [recording, setRecording] = useState(false);
  const [lastBlob, setLastBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      // cleanup object url
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    setMessage("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // create a webm blob (widely supported by modern browsers)
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setLastBlob(blob);

        // create compatible URL for playback
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        // attempt to resume audio context / play on user gesture if desired
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic access error:", err);
      setMessage("Please allow microphone access");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      try {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }
    setRecording(false);
  };

  const playAudio = async () => {
    if (!audioURL) {
      setMessage("No audio to play");
      return;
    }
    try {
      // use audio element to play (ensures proper decoding)
      const el = audioRef.current;
      el.volume = 1.0;
      await el.play();
    } catch (err) {
      console.error("Playback error:", err);
      setMessage("Playback failed (browser may block auto-play)");
    }
  };

  const registerVoice = async () => {
    if (!lastBlob) return setMessage("Record a voice sample first");

    setLoading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("name", localStorage.getItem("va_user") || "guest");
      form.append("voice", lastBlob, "voice.webm");

      const token = localStorage.getItem("va_token") || "";

      const res = await axios.post(`${API_BASE}/api/register`, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setMessage(res.data.message || "Registered");
    } catch (err) {
      console.error("Register error:", err);
      setMessage("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyVoice = async () => {
    if (!lastBlob) return setMessage("Record a voice sample first");

    setLoading(true);
    setMessage("");

    try {
      const form = new FormData();
      form.append("voice", lastBlob, "voice.webm");
      const token = localStorage.getItem("va_token") || "";

      // call your backend verify endpoint
      const res = await axios.post(`${API_BASE}/api/verify`, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = res.data;
      if (data.verified) {
        setMessage(`✅ Verified as ${data.matchedUser || data.user || "user"} (conf ${Number(data.confidence || data.score || 0).toFixed(2)})`);
      } else {
        setMessage("❌ Not matched");
      }
    } catch (err) {
      console.error("Verify error:", err);
      setMessage(err?.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("va_token");
    localStorage.removeItem("va_user");
    window.location.href = "/";
  };

  return (
    <div className="container">
      <div className="topbar card" style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600, color: "var(--primary)" }}>🎙 VoiceAuth</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ color: "var(--muted)" }}>{localStorage.getItem("va_user") || "Guest"}</div>
          <button className="btn ghost" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ margin: 0, marginBottom: 10 }}>Record & Verify</h3>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Click to record a short voice sample (2–4s)</div>

          <div className="rec-controls" style={{ marginTop: 16 }}>
            {!recording ? (
              <div className="mic" onClick={startRecording} title="Start recording">🎤</div>
            ) : (
              <div className="mic" onClick={stopRecording} style={{ background: "linear-gradient(135deg,#ff7b92,#ff6b88)" }} title="Stop recording">⏹</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn primary" onClick={registerVoice} disabled={loading || !lastBlob}>Register</button>
                <button className="btn" onClick={verifyVoice} disabled={loading || !lastBlob}>Verify</button>
                <button className="btn" onClick={playAudio} disabled={!audioURL}>Play</button>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Tip: record in a quiet place and use similar phrase for register & verify.</div>
            </div>
          </div>

          <audio ref={audioRef} src={audioURL} style={{ marginTop: 14 }} controls />

          {message && (
            <div className={`msg ${message.startsWith("✅") ? "success" : message.startsWith("❌") ? "error" : ""}`} style={{ marginTop: 14 }}>
              {message}
            </div>
          )}
        </div>

        <aside className="card">
          <h4 style={{ marginTop: 0 }}>Quick Info</h4>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            Registered users: <strong>{/* this is static placeholder; fetch via API */} — </strong>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Status</div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 4, background: "var(--success)" }}></div>
                <div style={{ color: "var(--muted)" }}>Service available</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
