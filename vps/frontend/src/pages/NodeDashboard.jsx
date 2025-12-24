import { useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import DenseNodeTable from "../components/DenseNodeTable"
import SolarBatteryChart from "../components/SolarBatteryChart"
const API = import.meta.env.VITE_API_URL

// Socket points to nginx host, with explicit socket.io path
const socket = io(API, {
  path: "/sound-locator/api/socket.io",
  transports: ["websocket", "polling"]
})

// ---------- helpers ----------
function pickId(node) {
  if (node?.id) return node.id
  const k = node?.key || ""
  const parts = k.split(":")
  return parts.length >= 3 ? parts[2] : k
}

function fmt(v, digits = 2) {
  const n = Number(v)
  if (Number.isFinite(n)) return n.toFixed(digits)
  if (v == null) return "—"
  return String(v)
}

function msToHMS(sec) {
  const n = Number(sec)
  if (!Number.isFinite(n)) return "—"
  const s = Math.max(0, Math.floor(n))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${h}h ${m}m ${ss}s`
}

// Decide what to show for each device row based on meta keys
function pickFields(meta = {}) {
  const hasWeather =
    meta.interior_temp_f != null ||
    meta.interior_humidity_pct != null ||
    meta.interior_dew_point_f != null ||
    meta.interior_heat_index_f != null

  const hasPower =
    meta.battery_voltage != null ||
    meta.solar_voltage != null

  if (hasPower) {
    return [
      ["Batt", meta.battery_voltage, "V"],
      ["Solar", meta.solar_voltage, "V"]
    ]
  }

  if (hasWeather) {
    return [
      ["Temp", meta.interior_temp_f, "F"],
      ["Hum", meta.interior_humidity_pct, "%"],
      ["Dew", meta.interior_dew_point_f, "F"],
      ["Heat", meta.interior_heat_index_f, "F"]
    ]
  }

  // General status-style fields
  const common = []
  if (meta.rssi != null) common.push(["RSSI", meta.rssi, ""])
  if (meta.uptime_s != null) common.push(["Up", msToHMS(meta.uptime_s), ""])
  if (meta.wifi_connected_s != null) common.push(["WiFi", msToHMS(meta.wifi_connected_s), ""])
  if (common.length) return common

  // fallback: show first few key=value pairs
  const entries = Object.entries(meta).slice(0, 6)
  return entries.map(([k, v]) => [k, v, ""])
}

function MetaPills({ meta }) {
  const obj = meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {}
  const fields = pickFields(obj)

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {fields.map(([label, value, unit]) => (
        <span
          key={label}
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid #333",
            fontSize: 12,
            fontFamily: "monospace",
            whiteSpace: "nowrap"
          }}
          title={`${label}: ${value ?? "—"}`}
        >
          {label}: {typeof value === "string" ? value : fmt(value)}
          {unit ? ` ${unit}` : ""}
        </span>
      ))}
    </div>
  )
}

function StatusDot({ status }) {
  const color =
    status === "OK" ? "limegreen" :
    status === "STALE" ? "orange" :
    status === "OFFLINE" ? "red" : "gray"

  return (
    <span style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color,
      marginRight: 6,
      verticalAlign: "middle"
    }} />
  )
}

function StatusPill({ status }) {
  const bg =
    status === "OK" ? "rgba(50,205,50,0.2)" :
    status === "DEGRADED" ? "rgba(255,165,0,0.2)" :
    status === "DOWN" ? "rgba(255,0,0,0.2)" :
    "rgba(128,128,128,0.2)"

  const color =
    status === "OK" ? "limegreen" :
    status === "DEGRADED" ? "orange" :
    status === "DOWN" ? "red" :
    "gray"

  return (
    <span style={{
      padding: "4px 10px",
      borderRadius: 999,
      background: bg,
      color,
      border: `1px solid ${color}`,
      fontSize: 12
    }}>
      {status}
    </span>
  )
}

function StationCard({ stationId, stationStatus, nodes }) {
  const sorted = [...nodes].sort((a, b) => (a.kind || "").localeCompare(b.kind || ""))

  return (
    <div style={{ border: "1px solid #333", borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>{stationId}</h3>
        <StatusPill status={stationStatus || "UNKNOWN"} />
      </div>

      <div style={{ marginTop: 10, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th align="left">Kind</th>
              <th align="left">Name/ID</th>
              <th align="left">Status</th>
              <th align="left">Last Seen</th>
              <th align="left">Data</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((n) => (
              <tr key={n.key} style={{ borderTop: "1px solid #222" }}>
                <td>{n.kind ?? "—"}</td>
                <td>{n.name || n.id || pickId(n)}</td>
                <td><StatusDot status={n.status} /> {n.status ?? "—"}</td>
                <td>{n.lastSeen ? new Date(n.lastSeen).toLocaleTimeString() : "—"}</td>
                <td><MetaPills meta={n.meta} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- page ----------
export default function NodeDashboard() {
  const [nodes, setNodes] = useState({})
  const [stations, setStations] = useState({})

  // 1) Initial snapshot
  useEffect(() => {
    const url = `${API}/sound-locator/api/nodes`
    fetch(url)
      .then(r => r.json())
      .then(list => {
        const map = {}
        list.forEach(n => (map[n.key] = n))
        setNodes(map)
      })
      .catch(err => console.error("Failed to load nodes", err))
  }, [])

  // 2) Live updates
  useEffect(() => {
    const onNode = (node) => setNodes(prev => ({ ...prev, [node.key]: node }))
    const onStation = (st) => setStations(prev => ({ ...prev, [st.station]: st }))

    socket.on("node:update", onNode)
    socket.on("station:update", onStation)

    return () => {
      socket.off("node:update", onNode)
      socket.off("station:update", onStation)
    }
  }, [])

  const nodesByStation = useMemo(() => {
    return Object.values(nodes).reduce((acc, n) => {
      const sid = n.station || "unknown"
      acc[sid] ??= []
      acc[sid].push(n)
      return acc
    }, {})
  }, [nodes])

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Sound Locator Status</h2>

      {/* Station cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        {Object.entries(nodesByStation).map(([stationId, list]) => (
          <StationCard
            key={stationId}
            stationId={stationId}
            stationStatus={stations[stationId]?.status}
            nodes={list}
          />
        ))}
      </div>

      {/* Dense table */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: "0 0 10px 0" }}>Dense Status Table</h2>
        <DenseNodeTable nodesByKey={nodes} />
      </div>
      <div style={{ marginTop: 32 }}>
      <SolarBatteryChart station="1" kind="esp32" id="S1E3" days={3} />
      </div>
    </div>
  )
}
