import { useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import DenseNodeTable from "../components/DenseNodeTable"

const API = import.meta.env.VITE_API_URL
const socket = io(`${API}/sound-locator/api`)

export default function NodeDashboard() {
  const [nodes, setNodes] = useState({})
  const [stations, setStations] = useState({})

  // Debug socket lifecycle (temporary)
  useEffect(() => {
    const onConnect = () => console.log("socket connected", socket.id)
    const onErr = (err) => console.log("socket connect_error", err.message)
    const onDisc = (reason) => console.log("socket disconnected", reason)

    socket.on("connect", onConnect)
    socket.on("connect_error", onErr)
    socket.on("disconnect", onDisc)

    return () => {
      socket.off("connect", onConnect)
      socket.off("connect_error", onErr)
      socket.off("disconnect", onDisc)
    }
  }, [])

  // 1) Initial snapshot
  useEffect(() => {
    const url = `${API}/sound-locator/api/api/nodes`

    fetch(url)
      .then(async (r) => {
        const text = await r.text()
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${text.slice(0, 200)}`)
        return JSON.parse(text)
      })
      .then((list) => {
        const map = {}
        list.forEach((n) => (map[n.key] = n))
        setNodes(map)
      })
      .catch((err) => console.error("Failed to load nodes", err))
  }, [])

  // 2) Live updates
  useEffect(() => {
    const onNode = (node) => setNodes((prev) => ({ ...prev, [node.key]: node }))
    const onStation = (st) => setStations((prev) => ({ ...prev, [st.station]: st }))

    socket.on("node:update", onNode)
    socket.on("station:update", onStation)

    return () => {
      socket.off("node:update", onNode)
      socket.off("station:update", onStation)
    }
  }, [])

  // Needed for station cards
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12
        }}
      >
        {Object.entries(nodesByStation).map(([stationId, list]) => (
          <StationCard
            key={stationId}
            stationId={stationId}
            stationStatus={stations[stationId]?.status}
            nodes={list}
          />
        ))}
      </div>

      {/* Dense Table */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: "0 0 10px 0" }}>Dense Status Table</h2>
        <DenseNodeTable nodesByKey={nodes} />
      </div>
    </div>
  )
}

function StationCard({ stationId, stationStatus, nodes }) {
  const sorted = [...nodes].sort((a, b) => (a.kind || "").localeCompare(b.kind || ""))

  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: 10,
        padding: 12
      }}
    >
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
              <th align="left">Meta</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((n) => (
              <tr key={n.key} style={{ borderTop: "1px solid #222" }}>
                <td>{n.kind}</td>
                <td>{n.name || (n.key ? n.key.split(":").slice(-1)[0] : "")}</td>
                <td>
                  <StatusDot status={n.status} /> {n.status}
                </td>
                <td>{n.lastSeen ? new Date(n.lastSeen).toLocaleTimeString() : "—"}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {n.meta && typeof n.meta === "object" ? Object.keys(n.meta).join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusDot({ status }) {
  const color =
    status === "OK" ? "limegreen" : status === "STALE" ? "orange" : status === "OFFLINE" ? "red" : "gray"

  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        marginRight: 6
      }}
    />
  )
}

function StatusPill({ status }) {
  const bg =
    status === "OK"
      ? "rgba(50,205,50,0.2)"
      : status === "DEGRADED"
        ? "rgba(255,165,0,0.2)"
        : status === "DOWN"
          ? "rgba(255,0,0,0.2)"
          : "rgba(128,128,128,0.2)"

  const color =
    status === "OK" ? "limegreen" : status === "DEGRADED" ? "orange" : status === "DOWN" ? "red" : "gray"

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color,
        border: `1px solid ${color}`,
        fontSize: 12
      }}
    >
      {status}
    </span>
  )
}
