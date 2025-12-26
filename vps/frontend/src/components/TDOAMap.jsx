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

  const colors = ["red", "orange", "blue", "cyan", "yellow", "white"];

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
    <MapContainer center={mapCenter} zoom={17} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />

      <ZoomToStations stations={stations} />

      {/* Stations */}
      {stations.map((s, i) => {
        // If your node.station matches these, we assume A=1, B=2, etc.
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
      {hyperbolas.map((h, idx) => (
        <Polyline
          key={idx}
          positions={h.points.map((pt) => [pt[0], pt[1]])}
          color={colors[idx % colors.length]}
          weight={2}
        />
      ))}
    </MapContainer>
  );
}
