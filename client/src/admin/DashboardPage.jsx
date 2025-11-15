import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DashboardPage() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/user-count")
      .then(r => setCount(r.data.count ?? r.data.total_users))
      .catch(() => setCount(null));
  }, []);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="grid-cards">
        <div className="card small">
          <div className="card-title">Registered Users</div>
          <div className="card-value">{count !== null ? count : "—"}</div>
        </div>

        <div className="card small">
          <div className="card-title">Last action</div>
          <div className="card-value">Ready</div>
        </div>
      </div>

      <section style={{marginTop:20}}>
        <div className="card">
          <h3>Quick tips</h3>
          <ul>
            <li>Use the Users tab to play / delete samples.</li>
            <li>If uploads don’t play, check your `/uploads` static serving.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
