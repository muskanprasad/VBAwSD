// src/components/AdminRoutes.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function AdminRoutes() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/admin/users`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCount = async () => {
    try {
      const res = await axios.get(`${API}/api/user-count`);
      setCount(res.data.count ?? res.data.total ?? null);
    } catch (e) {
      console.error("Count err", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCount();
  }, []);

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>VoiceAuth Admin</div>

        <nav style={styles.nav}>
          <div style={styles.navItemActive}>📊 Dashboard</div>
          <div style={styles.navItem}>👥 Users</div>
          <div style={styles.navItem}>🎤 Samples</div>
          <div style={styles.navItem}>⚙ Settings</div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <h1 style={styles.heading}>Admin Dashboard</h1>

        <div style={{marginBottom:16, display:"flex", alignItems:"center", gap:12}}>
          <div style={{fontSize:16, color:"#344"}}>Total registered users: <strong>{count ?? users.length}</strong></div>
          <div>
            <button className="btn" onClick={() => { fetchUsers(); fetchCount(); }}>Refresh</button>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading users…</div>
        ) : (
          <div style={styles.card}>
            <h2 style={styles.subHeading}>Registered Users</h2>

            {users.length === 0 ? (
              <div>No users found.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Recordings</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{(u.recordings || []).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ... same styles object as before (omitted for brevity)
const styles = { /* keep earlier styles or copy from previous code block */ 
  wrapper: {
    display: "flex",
    background: "linear-gradient(to right, #e3f0ff, #eef7ff)",
    height: "100vh",
    fontFamily: "Inter, sans-serif",
  },

  sidebar: {
    width: "240px",
    background: "linear-gradient(180deg, #ffffffdd, #dfeaffdd)",
    backdropFilter: "blur(10px)",
    boxShadow: "4px 0 12px rgba(0,0,0,0.05)",
    padding: "20px 15px",
  },

  logo: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2B3A55",
    marginBottom: "25px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  navItem: {
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#333",
    fontSize: "15px",
  },

  navItemActive: {
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#6EA8FF",
    color: "white",
    fontWeight: "600",
    fontSize: "15px",
  },

  main: {
    flex: 1,
    padding: "40px",
  },

  heading: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2B3A55",
  },

  subHeading: {
    marginTop: "0",
    marginBottom: "20px",
    fontSize: "20px",
    color: "#394867",
  },

  card: {
    background: "#ffffffcc",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },

  loading: {
    fontSize: "18px",
    padding: "20px",
  },
};
