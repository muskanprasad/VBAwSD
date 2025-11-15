import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/admin";

export default function AdminRoutes() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("va_token");

      const res = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // FIX: Must use res.data.users
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Admin fetch failed:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    try {
      const token = localStorage.getItem("va_token");

      await axios.delete(`${API}/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Dashboard</h1>

      {users.length === 0 ? (
        <p>No users registered.</p>
      ) : (
        <table border="1" style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Recordings</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.recordings ? u.recordings.length : 0}</td>
                <td>
                  <button onClick={() => deleteUser(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
