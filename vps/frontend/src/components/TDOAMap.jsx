import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

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

function ZoomToStations({ stations }) {
  const map = useMap();

  useEffect(() => {
    // Check if stations data is available
    if (!stations || stations.length === 0) return;

    // Filter out any stations with invalid coordinates (lat=0, lon=0)
    const validStations = stations.filter(s => s.lat !== 0 && s.lon !== 0);
    
    // If there are no valid stations, don't do anything
    if (validStations.length === 0) return;

    // Calculate bounds to zoom into valid stations
    const bounds = L.latLngBounds(validStations.map(s => [s.lat, s.lon]));
    
    // Fit the map bounds with padding for better visibility
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [stations, map]);  // Dependency on stations and map to rerun effect when these change

  return null;  // No need to render anything here
}

export default function TDOAMap({ result }) {
  const defaultCenter = [38.836902, -77.3827];
  const mapCenter = result?.stations?.[0]
    ? [result.stations[0].lat, result.stations[0].lon]
    : defaultCenter;

  const stations = result?.stations || [];
  const omit_solutions = result?.omit_solutions || [];
  const global_solution = result?.global_solution || null;
  const hyperbolas = result?.hyperbolas || [];

  const colors = ["red", "orange", "blue", "cyan", "yellow", "white"];

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


  return (
    <MapContainer center={mapCenter} zoom={17} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

        {/* ⭐ AUTO-ZOOM WHEN PRESET CHANGES */}
        <ZoomToStations stations={stations} />

      {/* Stations */}
      {stations.map((s, i) => (
        <Marker
          key={i}
          position={[s.lat, s.lon]}
          icon={makeStationIcon(String.fromCharCode(65 + i))} // 65 = "A"
        />
      ))}

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

