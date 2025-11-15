import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AudioPage(){
  const [files, setFiles] = useState([]);
  const token = localStorage.getItem("va_token");

  useEffect(() => {
    // We'll reuse admin/users endpoint and flatten recordings
    axios.get("http://localhost:5000/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      const list = r.data.users ?? r.data;
      const audioList = [];
      list.forEach(u => {
        (u.recordings || []).forEach(rec => {
          audioList.push({
            user: u.name || u.username,
            file_id: rec.file_id,
            url: rec.cleaned_url,
            created_at: rec.created_at
          });
        });
      });
      setFiles(audioList);
    }).catch(err => {
      console.error(err);
      setFiles([]);
    });
  }, []);

  const play = (url) => {
    if (!url) return;
    const a = new Audio(url);
    a.play();
  };

  return (
    <div>
      <h1 className="page-title">Audio Samples</h1>
      <div className="card">
        {files.length === 0 ? <div className="muted">No audio files</div> : (
          <div className="audio-list">
            {files.map(f => (
              <div className="audio-row" key={f.file_id}>
                <div>
                  <div className="username">{f.user}</div>
                  <div className="small muted">{new Date(f.created_at).toLocaleString()}</div>
                </div>
                <div className="rec-actions">
                  <button className="btn tiny" onClick={() => play(f.url)}>Play</button>
                  <a className="btn tiny" href={f.url} download>Download</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
