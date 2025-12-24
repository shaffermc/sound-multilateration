import React, { useMemo } from "react"

const STATUS_RANK = { OFFLINE: 0, STALE: 1, OK: 2 }

// ---- helpers ----
function ageMs(lastSeen) {
  if (!lastSeen) return null
  const t = new Date(lastSeen).getTime()
  if (Number.isNaN(t)) return null
  return Date.now() - t
}

function formatAge(ms) {
  if (ms == null) return "—"
  if (ms < 1000) return "now"
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

function safe(v) {
  if (v == null) return "—"
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  try { return JSON.stringify(v) } catch { return String(v) }
}

function pickId(node) {
  // Prefer explicit node.id, else try to parse from key like "1:esp32:S1E2"
  if (node?.id) return node.id
  const k = node?.key || ""
  const parts = k.split(":")
  return parts.length >= 3 ? parts[2] : k
}

function bytesToHuman(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n)) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
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

// ---- main ----
export default function DenseNodeTable({ nodesByKey }) {
  const nodes = useMemo(() => Object.values(nodesByKey || {}), [nodesByKey])

  const rows = useMemo(() => {
    const copy = [...nodes]
    copy.sort((a, b) => {
      const sa = (a.station || "").localeCompare(b.station || "")
      if (sa !== 0) return sa

      const ra = STATUS_RANK[a.status] ?? 99
      const rb = STATUS_RANK[b.status] ?? 99
      if (ra !== rb) return ra - rb

      const ka = (a.kind || "").localeCompare(b.kind || "")
      if (ka !== 0) return ka

      const ia = pickId(a).localeCompare(pickId(b))
      return ia
    })
    return copy
  }, [nodes])

  if (!rows.length) return <p>No nodes yet.</p>

  return (
    <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#111" }}>
            <Th>Station</Th>
            <Th>ID</Th>
            <Th>Type</Th>
            <Th>Name</Th>

            <Th>Status</Th>
            <Th>Age</Th>
            <Th>Last Seen</Th>

            <Th>Uptime</Th>
            <Th>WiFi Conn</Th>
            <Th>RSSI</Th>
            <Th>Local IP</Th>
            <Th>Public IP</Th>

            <Th>Daily BW</Th>
            <Th>Free Space</Th>
            <Th>File Count</Th>

            <Th>Meta</Th>
          </tr>
        </thead>

        <tbody>
          {rows.map((n) => {
            const ms = ageMs(n.lastSeen)
            const staleStyle =
              n.status === "OFFLINE" ? { background: "rgba(255,0,0,0.08)" } :
              n.status === "STALE" ? { background: "rgba(255,165,0,0.08)" } :
              {}

            const meta = (n?.meta && typeof n.meta === "object" && !Array.isArray(n.meta)) ? n.meta : {}

            // Map your chosen meta keys here (standardize these on devices over time)
            const uptime_s = meta.uptime_s ?? meta.uptime ?? null
            const wifi_s = meta.wifi_connected_s ?? meta.wifi_conn_s ?? null
            const rssi = meta.rssi ?? n.rssi ?? null
            const local_ip = meta.local_ip ?? meta.ip_local ?? null
            const public_ip = meta.public_ip ?? meta.ip_public ?? null
            const daily_bw = meta.daily_total_bandwidth ?? meta.daily_bandwidth_used ?? null
            const free_space = meta.free_space_bytes ?? meta.free_space ?? null
            const file_count = meta.file_count ?? null

            const metaPairs = Object.entries(meta)
            .slice(0, 8)
            .map(([k, v]) => `${k}=${safe(v)}`)
            .join(", ")

            return (
              <tr key={n.key} style={{ borderTop: "1px solid #222", ...staleStyle }}>
                <Td>{n.station ?? "—"}</Td>
                <TdMono>{pickId(n)}</TdMono>
                <Td>{n.kind ?? "—"}</Td>
                <Td>{n.name ?? "—"}</Td>

                <Td><StatusDot status={n.status} />{n.status ?? "—"}</Td>
                <Td>{formatAge(ms)}</Td>
                <Td>{n.lastSeen ? new Date(n.lastSeen).toLocaleString() : "—"}</Td>

                <Td>{uptime_s != null ? msToHMS(uptime_s) : "—"}</Td>
                <Td>{wifi_s != null ? msToHMS(wifi_s) : "—"}</Td>
                <Td>{rssi != null ? safe(rssi) : "—"}</Td>
                <TdMono>{local_ip != null ? safe(local_ip) : "—"}</TdMono>
                <TdMono>{public_ip != null ? safe(public_ip) : "—"}</TdMono>

                <Td>{daily_bw != null ? safe(daily_bw) : "—"}</Td>
                <Td>{free_space != null ? bytesToHuman(free_space) : "—"}</Td>
                <Td>{file_count != null ? safe(file_count) : "—"}</Td>

                <Td title={safe(meta)} style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis" }}> {metaPairs || "—"} </Td>

              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }) {
  return (
    <th style={{ padding: "8px 10px", textAlign: "left", whiteSpace: "nowrap" }}>
      {children}
    </th>
  )
}

function Td({ children, style }) {
  return (
    <td style={{ padding: "8px 10px", verticalAlign: "top", whiteSpace: "nowrap", ...style }}>
      {children}
    </td>
  )
}

function TdMono({ children }) {
  return (
    <td style={{ padding: "8px 10px", verticalAlign: "top", whiteSpace: "nowrap", fontFamily: "monospace" }}>
      {children}
    </td>
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
