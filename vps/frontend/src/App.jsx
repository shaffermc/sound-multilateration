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
import Esp32Dashboard from "./components/ESP32Dashboard";
import TitlePNG from "./assets/title.png";
import ListeningStationCoordinates from "./assets/1.png"
import DateTimeOfSound from "./assets/2.png"
import AudioFileMerging from "./assets/3.png"
import MeasureTimeDelayOffsets from "./assets/4.png"
import EnterTimeDelayOffsetes from "./assets/5.png"

export default function App() {
  const [result, setResult] = useState(null);

  return (
    <div style={styles.container}>

      {/* LEFT SIDEBAR (20%) */}
      <div style={styles.sidebar}>
        <div style={{ textAlign: "center" }}><img src={TitlePNG} alt="Title" style={{
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    marginBottom: 4,
  }} /></div>
        <div style={{ textAlign: "center" }}><img src={ListeningStationCoordinates} alt="Listening Station Coordinates" style={{
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    marginBottom: 4,
  }}/></div>
        <div><CreatePlotJSON onResult={setResult} /></div>
        <div style={{ textAlign: "center" }}><img src={DateTimeOfSound} alt="Date and Time of Sound" style={{
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    marginBottom: 4,
  }} /></div>
        <RetrieveAudio />
        <RetrievalStatus />
        <div style={{ textAlign: "center" }}><img src={AudioFileMerging} alt="Audio File Merging"style={{
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    marginBottom: 4,
  }} /></div>
        <AudioFileList />
        <div style={{ textAlign: "center" }}><img src={MeasureTimeDelayOffsets} alt="Measure Time Delay Offsets"style={{
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    marginBottom: 4,
  }} /></div>
        <div style={{ textAlign: "center" }}>Follow instructions <a href="instructions.html">here</a> to find time delay offsets.</div>
        <div style={{ textAlign: "center" }}><img src={EnterTimeDelayOffsetes} alt="Enter Time Delays Offsets" style={{
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    marginBottom: 4,
  }} /></div>

        <TDOAParameters
           stations={result?.stations || []}
           onResult={setResult}
           />
          {/*}
        <StationStatus />
        <BandwidthDisplay />
        <AddInstruction />
        <InstructionsList />
        <Esp32Dashboard />
        */}
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
    minWidth: "260px",           // ✅ prevents crushing
    maxWidth: "340px",           // ✅ prevents overflow growth
    background: "#ffffff",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
    overflowY: "auto",
    overflowX: "hidden",         // ✅ KEY LINE
    borderRight: "2px solid #ddd",
  },

  mapContainer: {
    width: "80%",
    height: "100%",
  },
};
