// client/src/components/UserDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
const API = "http://localhost:5000";

export default function UserDashboard(){
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [message, setMessage] = useState("");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(()=> {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const start = async () => {
    setMessage("");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = (e) => { if(e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/wav" });
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        setBlobUrl(URL.createObjectURL(b));
      };
      mr.start();
      setRecording(true);
    } catch (e) {
      console.error("Mic err", e);
      setMessage("Please allow microphone");
    }
  };

  const stop = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
      mediaRef.current.stream.getTracks().forEach(t=>t.stop());
    }
    setRecording(false);
  };

  const play = () => {
    if (!blobUrl) return setMessage("No recording");
    const a = new Audio(blobUrl);
    a.play();
  };

  const registerVoice = async () => {
    setMessage("");
    if (!chunksRef.current.length) return setMessage("Record first");
    const blob = new Blob(chunksRef.current, { type: "audio/wav" });
    const fd = new FormData();
    const username = localStorage.getItem("va_user") || "guest";
    fd.append("name", username);
    fd.append("voice", blob, "voice.wav");
    try {
      const res = await axios.post(`${API}/api/register`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage("Registered successfully");
    } catch (e) {
      console.error("Register error", e);
      setMessage(e?.response?.data?.error || "Registration failed");
    }
  };

  const verifyVoice = async () => {
    setMessage("");
    if (!chunksRef.current.length) return setMessage("Record first");
    const blob = new Blob(chunksRef.current, { type: "audio/wav" });
    const fd = new FormData();
    fd.append("voice", blob, "voice.wav");
    try {
      const res = await axios.post(`${API}/api/verify`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const d = res.data;
      if (d.verified) setMessage(`✅ Matched: ${d.matchedUser} (score ${Number(d.confidence).toFixed(3)})`);
      else setMessage("❌ Not matched");
    } catch (e) {
      console.error("Verify error:", e);
      setMessage(e?.response?.data?.error || "Verification failed");
    }
  };

  return (
    <div style={{padding:24}}>
      <h2>Record voice</h2>
      <div style={{marginBottom:12}}>
        {!recording && <button onClick={start}>🎤 Start</button>}
        {recording && <button onClick={stop}>⛔ Stop</button>}
        <button onClick={play} style={{marginLeft:8}}>▶ Play</button>
      </div>

      <div style={{marginTop:12}}>
        <button onClick={registerVoice}>Register</button>
        <button onClick={verifyVoice} style={{marginLeft:8}}>Verify</button>
      </div>

      <div style={{marginTop:16, color: message?.startsWith("✅") ? "green" : "tomato"}}>{message}</div>

      <div style={{marginTop:20}}>
        <small>Signed in as: {localStorage.getItem("va_user") || "Guest"}</small>
      </div>
    </div>
  );
}
