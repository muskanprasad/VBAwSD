import React, { useState } from "react";

export default function SettingsPage(){
  const [msg, setMsg] = useState("");
  const changePassword = () => setMsg("Password change not implemented yet (backend needed)");
  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <div className="card">
        <div className="field">
          <label>Change admin password</label>
          <input placeholder="New password" />
        </div>
        <button className="btn primary" onClick={changePassword}>Change password</button>
        {msg && <div className="msg">{msg}</div>}
      </div>
    </div>
  );
}
