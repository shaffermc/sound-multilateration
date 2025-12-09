import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});

export default function TDOAMap({ result }) {
  if (!result) return <p>No results yet.</p>;

  const { stations, omit_solutions, global_solution, hyperbolas } = result;

  const mapCenter = [stations[0].lat, stations[0].lon];

  return (
    <MapContainer center={mapCenter} zoom={17} style={{ height: "80vh", width: "100%" }}>
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {/* Stations */}
      {stations.map((s, i) => (
        <Marker key={i} position={[s.lat, s.lon]}>
          <Popup>Station {i+1}</Popup>
        </Marker>
      ))}

      {/* Omit-one solutions */}
      {omit_solutions.map((p, i) => (
        <Marker key={`omit-${i}`} position={[p.lat, p.lon]}>
          <Popup>Solution {i+1}</Popup>
        </Marker>
      ))}

      {/* Global solution */}
      <Marker position={[global_solution.lat, global_solution.lon]}>
        <Popup>Global Solution</Popup>
      </Marker>

      {/* Hyperbolas */}
      {hyperbolas.map((h, idx) => (
        <Polyline
          key={idx}
          positions={h.points.map(p => [p[0], p[1]])}
          color="yellow"
          weight={2}
        />
      ))}
    </MapContainer>
  );
}
