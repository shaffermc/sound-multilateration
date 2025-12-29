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

  // local state for dropdown selection (default from prop)
  const [rangeDays, setRangeDays] = useState(days)

  useEffect(() => {
    if (!station || !kind || !id) return

    let isCancelled = false
    const url = `${API}/sound-locator/api/nodes/history/${station}/${kind}/${id}?days=${rangeDays}`

    const fetchData = () => {
      setLoading(prev => (data.length === 0 ? true : prev))
      setError(null)

      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
        .then(json => {
          if (isCancelled) return

          const filtered = json
            .filter(d =>
              typeof d.solar_voltage === "number" ||
              typeof d.battery_voltage === "number"
            )
            .map(d => {
              const dt = new Date(d.ts)

              return {
                ...d,
                tsMs: dt.getTime(),
                timeLabel: dt.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/New_York",
                }),
              }
            })
            .sort((a, b) => a.tsMs - b.tsMs)

          setData(filtered)
          setLoading(false)
        })
        .catch(err => {
          if (isCancelled) return
          setError(err.message)
          setLoading(false)
        })
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)

    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [station, kind, id, rangeDays])  

  return (
    <div style={{ marginTop: 16, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>
          Solar & Battery Voltage – Station {station} / {id}
        </h3>

        {/* 🔹 Day-range dropdown */}
        <select
          value={rangeDays}
          onChange={e => setRangeDays(Number(e.target.value))}
          style={{ padding: 4, fontSize: 12 }}
        >
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

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
                dataKey="tsMs"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10 }}
                minTickGap={24}
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/New_York",
                  })
                }
              />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={["auto", "auto"]}
                label={{
                  value: "Volts",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 }
                }}
              />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(value).toLocaleString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/New_York",
                  })
                }
              />
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
