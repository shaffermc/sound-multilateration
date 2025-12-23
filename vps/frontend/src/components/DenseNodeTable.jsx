import React, { useMemo } from "react"

const STATUS_RANK = { OFFLINE: 0, STALE: 1, OK: 2 }

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
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

function safeString(v) {
  if (v == null) return ""
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  // avoid rendering objects directly
  try { return JSON.stringify(v) } catch { return String(v) }
}

export default function DenseNodeTable({ nodesByKey }) {
  // nodesByKey is your normalized object: { [key]: node }
  const nodes = useMemo(() => Object.values(nodesByKey || {}), [nodesByKey])

  const metaColumns = useMemo(() => {
    const keys = new Set()
    for (const n of nodes) {
      if (n?.meta && typeof n.meta === "object" && !Array.isArray(n.meta)) {
        for (const k of Object.keys(n.meta)) keys.add(k)
      }
    }
    return Array.from(keys).sort()
  }, [nodes])

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

      const ia = (a.key || "").localeCompare(b.key || "")
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
            <Th>Kind</Th>
            <Th>Name/ID</Th>
            <Th>Status</Th>
            <Th>Age</Th>
            <Th>Last Seen</Th>
            {metaColumns.map(k => <Th key={k}>{k}</Th>)}
          </tr>
        </thead>

        <tbody>
          {rows.map(n => {
            const ms = ageMs(n.lastSeen)
            const staleStyle =
              n.status === "OFFLINE" ? { background: "rgba(255,0,0,0.08)" } :
              n.status === "STALE" ? { background: "rgba(255,165,0,0.08)" } :
              {}

            return (
              <tr key={n.key} style={{ borderTop: "1px solid #222", ...staleStyle }}>
                <Td>{n.station}</Td>
                <Td>{n.kind}</Td>
                <Td>{n.name || (n.key ? n.key.split(":").at(-1) : "")}</Td>
                <Td>
                  <StatusDot status={n.status} />
                  {n.status}
                </Td>
                <Td>{formatAge(ms)}</Td>
                <Td>{n.lastSeen ? new Date(n.lastSeen).toLocaleString() : "—"}</Td>

                {metaColumns.map(k => (
                  <Td key={k}>{safeString(n?.meta?.[k])}</Td>
                ))}
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

function Td({ children }) {
  return (
    <td style={{ padding: "8px 10px", verticalAlign: "top", whiteSpace: "nowrap" }}>
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
