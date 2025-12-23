import React from "react";

export default function SocketDebugPanel({ devices, stations }) {
  return (
    <div style={{
      border: "2px dashed #888",
      padding: "1rem",
      marginBottom: "2rem",
      fontFamily: "monospace"
    }}>
      <h3>🔌 Socket Debug Panel</h3>

      <h4>Devices</h4>
      {Object.values(devices).length === 0 && <div>No devices yet</div>}
      {Object.values(devices).map(d => (
        <div key={d.key}>
          {d.key} — <b>{d.status}</b> — lastSeen:{" "}
          {new Date(d.lastSeen).toLocaleTimeString()}
        </div>
      ))}

      <h4 style={{ marginTop: "1rem" }}>Stations</h4>
      {Object.values(stations).length === 0 && <div>No stations yet</div>}
      {Object.values(stations).map(s => (
        <div key={s.station}>
          Station {s.station} — <b>{s.status}</b>
        </div>
      ))}
    </div>
  );
}
