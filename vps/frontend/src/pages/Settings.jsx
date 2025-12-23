import React, { useState, useEffect } from "react";
import { useDeviceSocket } from "../components/useDeviceSocket";
import SocketDebugPanel from "../components/SocketDebugPanel";


export default function Settings() {
  const [devices, setDevices] = useState({});

  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  useDeviceSocket(setDevices);

  useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/devices`)
    .then(res => res.json())
    .then(data => {
      const map = {}
      data.forEach(d => {
        map[d.key] = d
      })
      setDevices(map)
    })
    .catch(err => console.error("Failed to load devices", err))
}, [])



  return (
    <div style={{ padding: "2rem" }}>
      <SocketDebugPanel devices={devices} />
    </div>
  );
}
