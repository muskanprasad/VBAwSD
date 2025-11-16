// client/src/components/AdminLogin.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API = "http://localhost:5000";

export default function AdminLogin(){
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/admin-login`, { username: u, password: p });
      localStorage.setItem("va_token", res.data.token);
      nav("/admin");
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.error || "Login failed");
    }
  };

  return (
    // FIX: Added flex centering styles to the wrapper div
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', // Added for vertical centering
      paddingTop: 40,
      width: '100vw',
      minHeight: '100vh',
    }}>
      <div style={{ width: 300 }}> 
        <h2>Admin Login</h2>
        <input 
          placeholder="admin" 
          value={u} 
          onChange={e=>setU(e.target.value)} 
          // FIX: Added width: "100%"
          style={{display:"block", padding:8, marginBottom:8, width: "100%"}} 
        />
        <input 
          placeholder="password" 
          type="password" 
          value={p} 
          onChange={e=>setP(e.target.value)} 
          // FIX: Added width: "100%"
          style={{display:"block", padding:8, marginBottom:8, width: "100%"}} 
        />
        <button onClick={login}>Login</button>
        <div style={{color:"tomato"}}>{msg}</div>
      </div>
    </div>
  );
}