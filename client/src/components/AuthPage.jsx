import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const signup = async () => {
    setMessage("");
    if (!username || !password) return setMessage("Enter username & password");

    try {
      await axios.post(`${API_BASE}/api/auth/signup`, {
        username,
        password,
        role,
      });

      setMessage("Signup successful! Please login.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Signup failed");
    }
  };

  const login = async () => {
    setMessage("");
    if (!username || !password) return setMessage("Enter username & password");

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        username,
        password,
        role,
      });

      const token = res.data.token;

      localStorage.setItem("va_token", token);
      localStorage.setItem("va_role", role);
      localStorage.setItem("va_user", username);

      if (role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F8EFFF, #E3DFFD, #D7E3FC)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 255, 255, 0.55)",
          padding: "32px",
          borderRadius: "22px",
          backdropFilter: "blur(14px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#2B2D42", marginBottom: "18px" }}>
          🎙 VoiceAuth
        </h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={styles.input}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button onClick={login} style={styles.primaryBtn}>
          Login
        </button>

        <button onClick={signup} style={styles.ghostBtn}>
          Signup
        </button>

        {message && <div style={styles.message}>{message}</div>}
      </div>
    </div>
  );
}

const styles = {
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid #ccc",
    fontSize: "15px",
  },

  primaryBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "12px",
    fontSize: "16px",
    background: "#6C63FF",
    color: "white",
    border: "none",
    cursor: "pointer",
  },

  ghostBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "12px",
    fontSize: "16px",
    background: "#ffffffaa",
    border: "1px solid #6C63FF",
    color: "#6C63FF",
    cursor: "pointer",
  },

  message: {
    marginTop: "16px",
    padding: "10px",
    background: "rgba(255,255,255,0.7)",
    borderRadius: "10px",
    textAlign: "center",
    color: "#2B2D42",
  },
};
