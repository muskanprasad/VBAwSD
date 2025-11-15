import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("va_token");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // res.data.users per backend
      const list = res.data.users ?? res.data;
      setUsers(list);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user permanently?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const playUrl = (url) => {
    if (!url) return alert("No audio");
    const a = new Audio(url);
    a.play();
  };

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <div className="card">
        {loading ? "Loading..." : users.length === 0 ? "No users" : (
          <div className="users-list">
            {users.map(u => (
              <div className="user-row" key={u.id || u._id || u.username}>
                <div className="user-meta">
                  <div className="username">{u.name || u.username}</div>
                  <div className="small muted">features: {u.featuresLength ?? u.features?.length ?? 0}</div>
                </div>

                <div className="user-actions">
                  {(u.recordings && u.recordings.length > 0) ? (
                    u.recordings.map(r => (
                      <div key={r.file_id} className="rec-inline">
                        <button className="btn tiny" onClick={() => playUrl(r.cleaned_url)}>Play</button>
                        <a className="btn tiny" href={r.cleaned_url} download>Download</a>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No samples</div>
                  )}

                  <button className="btn danger tiny" onClick={() => deleteUser(u.id || u._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
