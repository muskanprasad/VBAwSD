// client/src/components/AuthPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API = "http://localhost:5000";

export default function AuthPage(){
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const go = async () => {
    if(!username) return setMsg("Enter username");
    // For this flow: create user if not exists? We'll rely on register endpoint later.
    // just navigate to dashboard and keep username in localStorage
    localStorage.setItem("va_user", username);
    navigate("/dashboard");
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
      <div style={{ width: 300, textAlign: 'center' }}>
        <h1>VoiceAuth</h1>
        <input 
          placeholder="Username" 
          value={username} 
          onChange={e=>setUsername(e.target.value)} 
          // FIX: Added width: "100%" to input style
          style={{display:"block",padding:12,width:"100%",marginBottom:12}} 
        />
        <button onClick={go} style={{padding:"10px 18px"}}>Continue</button>
        <div style={{color:"tomato", marginTop:12}}>{msg}</div>
        <div style={{marginTop:16}}>
          <small>Admin? <a href="/admin-login">Admin login</a></small>
        </div>
      </div>
    </div>
  );
}