import { useState } from "react";

import "./App.css";

import RetrieveAudio from "./components/RetrieveAudio";
import TDOAParameters from "./components/TDOAParameters";
import CreatePlotJSON from "./components/CreatePlotJSON";
import TDOAMap from "./components/TDOAMap";
import RetrievalStatus from "./components/RetrievalStatus";
import StationStatus from "./components/StationStatus";
import BandwidthDisplay from "./components/BandwidthDisplay";
import AddInstruction from "./components/AddInstruction";
import InstructionsList from "./components/InstructionsList";
import AudioFileList from "./components/AudioFileList";


export default function App() {
  const [result, setResult] = useState(null);

  return (
    <div style={styles.container}>

      {/* LEFT SIDEBAR (20%) */}
      <div style={styles.sidebar}>
        <div>
        <CreatePlotJSON onResult={setResult} />
        </div>
        <RetrieveAudio />
        <RetrievalStatus />
        {/*<AudioFileList />*/}
        <TDOAParameters
           stations={result?.stations || []}
           onResult={setResult}
           />
        <StationStatus />
        <BandwidthDisplay />
        <AddInstruction />
        <InstructionsList />

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
