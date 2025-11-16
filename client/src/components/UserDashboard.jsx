// client/src/components/UserDashboard.jsx
import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function UserDashboard({ username }) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [blobUrl, setBlobUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const start = async () => {
    setMessage("");
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize MediaRecorder
      recorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" }); // Ensure webm type
      chunksRef.current = [];

      recorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        // Store blob reference for immediate post-stop playback/upload
        recorderRef.current._lastBlob = blob; 
      };

      recorderRef.current.start();
      setRecording(true);
    } catch (err) {
      setMessage("Microphone access needed (check browser permissions).");
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      // Stop media tracks
      recorderRef.current.stream && recorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
  };

  // ✅ THE CRITICAL PLAYBACK FIX
  const play = () => {
    let playUrl = blobUrl;
    
    // Fallback: If blobUrl hasn't updated yet (e.g., immediate click after stop)
    if (!playUrl && recorderRef.current && recorderRef.current._lastBlob) {
      playUrl = URL.createObjectURL(recorderRef.current._lastBlob);
    }

    if (playUrl) {
      // Use simple Audio constructor for reliable browser playback
      const a = new Audio(playUrl);
      a.play().catch(e => {
        console.error("Audio playback failed:", e);
        setMessage("Playback failed. Check browser console for Media/Promise errors.");
      });
      setMessage("Playing audio...");
      
      // If we created a temporary URL, revoke it immediately
      if (!blobUrl && playUrl) {
          // This will be cleaned up on the next render
          // URL.revokeObjectURL(playUrl); 
      }

    } else {
      setMessage("Nothing recorded yet.");
    }
  };


  const register = async () => {
    setMessage("");
    setLoading(true);
    try {
      const blob = recorderRef.current && recorderRef.current._lastBlob;
      if (!blob) return setMessage("Record first");
      const fd = new FormData();
      fd.append("name", username || "guest");
      fd.append("voice", blob, "voice.webm"); 
      const token = localStorage.getItem("va_token");
      const res = await axios.post(`${API_BASE}/api/register`, fd, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      setMessage("Registered successfully");
    } catch (err) {
      console.error("Register error:", err);
      setMessage(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setMessage("");
    setLoading(true);
    try {
      const blob = recorderRef.current && recorderRef.current._lastBlob;
      if (!blob) return setMessage("Record first");
      const fd = new FormData();
      fd.append("voice", blob, "voice.webm");
      const token = localStorage.getItem("va_token");
      const res = await axios.post(`${API_BASE}/api/verify`, fd, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const data = res.data;
      if (data.verified) {
        setMessage(`✅ Matched: ${data.matchedUser} (score ${Number(data.confidence).toFixed(3)})`);
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

  return (
    <div className="card">
      <h2>Record voice</h2>

      <div className="controls">
        {!recording ? <button onClick={start}>🎤 Start</button> : <button onClick={stop}>⛔ Stop</button>}
        <button 
            onClick={play} 
            disabled={!blobUrl && !(recorderRef.current && recorderRef.current._lastBlob)}
        >
            ▶ Play
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={register} disabled={loading}>✅ Register</button>
        <button onClick={verify} disabled={loading}>🔍 Verify</button>
      </div>

      <div className="msg" style={{ marginTop: 12 }}>{message}</div>

      {/* Keep the audio element for visual reference and controls */}
      {blobUrl && (
        <audio 
            style={{ marginTop: 12, width: "100%" }} 
            controls 
            src={blobUrl} 
        />
      )}
    </div>
  );
}