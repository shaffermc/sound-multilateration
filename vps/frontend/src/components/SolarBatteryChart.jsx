import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

const API = import.meta.env.VITE_API_URL

export default function SolarBatteryChart({ station, kind, id, days = 3 }) {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!station || !kind || !id) return

    const url = `${API}/sound-locator/api/nodes/history/${station}/${kind}/${id}?days=${days}`
    setLoading(true)
    setError(null)

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        // Filter out samples without voltages (just in case)
        const filtered = json.filter(
          d =>
            typeof d.solar_voltage === "number" ||
            typeof d.battery_voltage === "number"
        )
        setData(filtered)
      })
      .catch(err => setError(err.message || "failed"))
      .finally(() => setLoading(false))
  }, [station, kind, id, days])

  return (
    <div style={{ marginTop: 16, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
      <h3 style={{ margin: "0 0 8px 0" }}>
        Solar & Battery Voltage – Station {station} / {id}
      </h3>

      {loading && <p style={{ fontSize: 12 }}>Loading...</p>}
      {error && <p style={{ fontSize: 12, color: "tomato" }}>Error: {error}</p>}
      {!loading && !error && !data.length && (
        <p style={{ fontSize: 12 }}>No samples yet for this node.</p>
      )}

      {data.length > 0 && (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10 }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                // your voltages are probably 0–25ish; this lets it auto-scale
                domain={["auto", "auto"]}
                label={{
                  value: "Volts",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 }
                }}
              />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="solar_voltage"
                name="Solar V"
                stroke="#ff9800"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="battery_voltage"
                name="Battery V"
                stroke="#4caf50"
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
