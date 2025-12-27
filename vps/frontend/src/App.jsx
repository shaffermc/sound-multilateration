import React, { useState } from "react";
import "./App.css";

import RetrieveAudio from "./components/RetrieveAudio";
import TDOAParameters from "./components/TDOAParameters";
import ManagePresets from "./components/ManagePresets";
import TDOAMap from "./components/TDOAMap";
import RetrievalStatus from "./components/RetrievalStatus";
import NodeDashboard from "./pages/NodeDashboard";

export default function App() {
  const [result, setResult] = useState(null);

  // Shared station coordinates for both presets + TDOAParameters
  const [stations, setStations] = useState([
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
  ]);

  // Shared TDOA times (tA..tD)
  const [times, setTimes] = useState([0, 0, 0, 0]);

  const params = new URLSearchParams(window.location.search);
  const isDashboard = params.has("dashboard");

  if (isDashboard) {
    return <NodeDashboard />;
  }

  // When presets change stations:
  const handleStationsChange = (newStations) => {
    setStations(newStations);
    // Also update result.stations so the map can draw station markers/polygons
    setResult((prev) => ({
      ...(prev || {}),
      stations: newStations,
    }));
  };

  // When TDOAParameters finishes and gets a plot result:
  const handleTDOAResult = (data) => {
    // Data likely contains plot info + maybe stations.
    setResult(data);
  };

  return (
    <div style={styles.container}>
      {/* LEFT SIDEBAR (20%) */}
      <div style={styles.sidebar}>
        <div style={titleStyle}>Sound Source Locator</div>

        <div style={sectionHeaderStyle}>Enter base station coordinates:</div>
        <div>
          <ManagePresets
            onStationsChange={handleStationsChange}
            times={times}
            onTimesLoad={setTimes}
          />
        </div>

        <div style={sectionHeaderStyle}>Enter Date/Time of Sound</div>
        <RetrieveAudio />
        <RetrievalStatus />

        <div style={sectionHeaderStyle}>Measure the TDOAs and enter here:</div>
        <div>
          <TDOAParameters
            stations={stations}
            times={times}
            setTimes={setTimes}
            onResult={handleTDOAResult}
          />
        </div>
      </div>

      {/* RIGHT MAP PANEL (80%) */}
      <div style={styles.mapContainer}>
        <TDOAMap result={result} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    background: "#ffffff",
  },
  sidebar: {
    width: "20%",
    minWidth: "260px",
    maxWidth: "340px",
    background: "#ffffff",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
    overflowY: "auto",
    overflowX: "hidden",
    borderRight: "2px solid #ddd",
  },
  mapContainer: {
    width: "80%",
    height: "100%",
  },
};

const titleStyle = {
  width: "100%",
  maxWidth: "260px",
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  color: "#333",
  margin: "12px auto 12px auto",
  paddingBottom: "6px",
  borderBottom: "2px solid #333",
};

const sectionHeaderStyle = {
  width: "100%",
  maxWidth: "260px",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  color: "#333",
  margin: "8px auto 4px auto",
  paddingBottom: "4px",
  borderBottom: "1px solid #ddd",
};
