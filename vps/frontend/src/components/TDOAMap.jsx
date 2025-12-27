import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL;

const socket = io(API, {
  path: "/sound-locator/api/socket.io",
  transports: ["websocket", "polling"],
});

// Helper: seconds → "Xh Ym Zs"
function secToHMS(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n)) return "—";
  const s = Math.max(0, Math.floor(n));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}h ${m}m ${ss}s`;
}

function ZoomToStations({ stations }) {
  const map = useMap();

  useEffect(() => {
    if (!stations || stations.length === 0) return;

    const validStations = stations.filter((s) => s.lat !== 0 && s.lon !== 0);
    if (validStations.length === 0) return;

    const bounds = L.latLngBounds(validStations.map((s) => [s.lat, s.lon]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [stations, map]);

  return null;
}

// Colorblind-friendly, professional palette per station pair
// Stations are A,B,C,D → indices 0,1,2,3
const pairColors = {
  "0-1": "#0072B2", // A–B (blue)
  "0-2": "#009E73", // A–C (green)
  "0-3": "#E69F00", // A–D (orange)
  "1-2": "#D55E00", // B–C (vermillion)
  "1-3": "#CC79A7", // B–D (reddish-purple)
  "2-3": "#56B4E9", // C–D (light blue)
};

const pairLabels = {
  "0-1": "A–B",
  "0-2": "A–C",
  "0-3": "A–D",
  "1-2": "B–C",
  "1-3": "B–D",
  "2-3": "C–D",
};

const legendStyle = {
  position: "absolute",
  top: "8px",
  right: "8px",
  background: "rgba(255, 255, 255, 0.9)",
  borderRadius: "6px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  padding: "6px 8px",
  fontSize: "11px",
  lineHeight: 1.4,
  zIndex: 1000,
};

export default function TDOAMap({ result }) {
  const [stationMeta, setStationMeta] = useState({});

  const defaultCenter = [38.836902, -77.3827];
  const mapCenter = result?.stations?.[0]
    ? [result.stations[0].lat, result.stations[0].lon]
    : defaultCenter;

  const stations = result?.stations || [];
  const omit_solutions = result?.omit_solutions || [];
  const global_solution = result?.global_solution || null;
  const hyperbolas = result?.hyperbolas || [];

  // Listen for live node updates
  useEffect(() => {
    const handleNodeUpdate = (node) => {
      const sid = node.station;
      const meta = node.meta || {};
      if (!sid) return;

      setStationMeta((prev) => ({
        ...prev,
        [String(sid)]: {
          uptime_s: meta.uptime_s ?? null,
          battery_voltage: meta.battery_voltage ?? null,
          temperature_f: meta.interior_temp_f ?? null,
        },
      }));
    };

    socket.on("node:update", handleNodeUpdate);
    return () => {
      socket.off("node:update", handleNodeUpdate);
    };
  }, []);

  const makeStationIcon = (label) =>
    new L.DivIcon({
      className: "",
      html: `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: blue;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">
          ${label}
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

  const makeOmitIcon = (label) =>
    new L.DivIcon({
      className: "",
      html: `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: red;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">
          ${label}
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

  const makeGlobalIcon = (label = "G") =>
    new L.DivIcon({
      className: "",
      html: `
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: yellow;
          border: 2px solid black;
          display: flex;
          align-items: center;
          justify-content: center;
          color: black;
          font-weight: bold;
          font-size: 12px;
        ">
          ${label}
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer center={mapCenter} zoom={17} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />

        <ZoomToStations stations={stations} />

        {/* Stations */}
        {stations.map((s, i) => {
          const stationId = String(i + 1);
          const meta = stationMeta[stationId] || {};
          const label = String.fromCharCode(65 + i); // "A", "B", "C", ...

          return (
            <Marker
              key={i}
              position={[s.lat, s.lon]}
              icon={makeStationIcon(label)}
            >
              <Popup>
                <div style={{ fontSize: "12px", lineHeight: 1.4 }}>
                  <div><strong>Station {label} (#{stationId})</strong></div>
                  {meta.uptime_s != null && <div>Uptime: {secToHMS(meta.uptime_s)}</div>}
                  {typeof meta.battery_voltage === "number" && (
                    <div>Battery: {meta.battery_voltage.toFixed(2)} V</div>
                  )}
                  {typeof meta.temperature_f === "number" && (
                    <div>Temp: {meta.temperature_f.toFixed(1)} °F</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Omit-one solutions */}
        {omit_solutions.map((p, i) => (
          <Marker
            key={`omit-${i}`}
            position={[p.lat, p.lon]}
            icon={makeOmitIcon(i + 1)}
          />
        ))}

        {/* Global solution */}
        {global_solution && (
          <Marker
            position={[global_solution.lat, global_solution.lon]}
            icon={makeGlobalIcon("★")}
          />
        )}

        {/* Hyperbola polylines */}
        {hyperbolas.map((h, idx) => {
          const pair = h.pair || [];    // [i, j]
          const key = pair.length === 2 ? `${pair[0]}-${pair[1]}` : String(idx);
          const color = pairColors[key] || "#999999";

          return (
            <Polyline
              key={idx}
              positions={h.points.map((pt) => [pt[0], pt[1]])}
              color={color}
              weight={2}
              opacity={0.85}
            />
          );
        })}
      </MapContainer>

      {/* Hyperbola legend */}
      <div style={legendStyle}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Hyperbola Pairs</div>
        {Object.entries(pairLabels).map(([key, label]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 2,
                backgroundColor: pairColors[key],
              }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
