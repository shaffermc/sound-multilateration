import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom circle icons
const blackIcon = new L.DivIcon({
  className: "custom-icon",
  html: '<div style="width:12px; height:12px; background:blue; border-radius:50%; border:2px solid white;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const redIcon = new L.DivIcon({
  className: "custom-icon",
  html: '<div style="width:12px; height:12px; background:red; border-radius:50%; border:2px solid white;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const yellowIcon = new L.DivIcon({
  className: "custom-icon",
  html: '<div style="width:14px; height:14px; background:yellow; border-radius:50%; border:2px solid black;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function TDOAMap({ result }) {
  const defaultCenter = [38.836902, -77.3827];
  const mapCenter = result?.stations?.[0]
    ? [result.stations[0].lat, result.stations[0].lon]
    : defaultCenter;

  const stations = result?.stations || [];
  const omit_solutions = result?.omit_solutions || [];
  const global_solution = result?.global_solution || null;
  const hyperbolas = result?.hyperbolas || [];

  // 🎨 Colors for hyperbolas
  const colors = ["red", "orange", "blue", "pink", "yellow", "green"];

  return (
    <MapContainer center={mapCenter} zoom={17} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {/* Stations */}
      {stations.map((s, i) => (
        <Marker key={i} position={[s.lat, s.lon]} icon={blackIcon}>
          <Popup>Station {i + 1}</Popup>
        </Marker>
      ))}

      {/* Omit-one solutions */}
      {omit_solutions.map((p, i) => (
        <Marker key={`omit-${i}`} position={[p.lat, p.lon]} icon={redIcon}>
          <Popup>Solution {i + 1}</Popup>
        </Marker>
      ))}

      {/* Global solution */}
      {global_solution && (
        <Marker position={[global_solution.lat, global_solution.lon]} icon={yellowIcon}>
          <Popup>Global Solution</Popup>
        </Marker>
      )}

      {/* Hyperbola polylines (each one a different color) */}
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
