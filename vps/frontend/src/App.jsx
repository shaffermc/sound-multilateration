import { useState } from "react";

import "./App.css";

import StationStatusTable from "./components/StationStatusTable";
import AddInstruction from "./components/AddInstruction";
import InstructionsList from "./components/InstructionsList";
import AudioFileList from "./components/AudioFileList";
import BandwidthDisplay from "./components/BandwidthDisplay";
import RetrieveAudio from "./components/RetrieveAudio";

import CreatePlotJSON from "./components/CreatePlotJSON";
import TDOAMap from "./components/TDOAMap";

export default function App() {
  const [result, setResult] = useState(null);

  return (
    <div style={styles.container}>

      {/* LEFT SIDEBAR (20%) */}
      <div style={styles.sidebar}>
        
        {/* You can reorder these however you like */}
        <StationStatusTable />
        <AddInstruction />
        <InstructionsList />
        <AudioFileList />
        <BandwidthDisplay />
        <RetrieveAudio />

        {/* New TDOA JSON generator */}
        <div style={{ marginTop: "20px" }}>
          <h3>TDOA Plot Generator</h3>
          <CreatePlotJSON onResult={setResult} />
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
    background: "#f2f2f2",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
    overflowY: "auto",
    borderRight: "2px solid #ddd",
  },
  mapContainer: {
    width: "80%",
    height: "100%",
  },
};
