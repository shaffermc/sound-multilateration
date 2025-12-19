import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; 

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
import SystemStatus from './pages/SystemStatus'; 

export default function App() {
  const [result, setResult] = useState(null);

  return (
    <Router>
      <div style={styles.container}>
        
        {/* LEFT SIDEBAR (20%) */}
        <div style={styles.sidebar}>
          <div style={titleStyle}>Sound Source Locator</div>
          <div style={sectionHeaderStyle}>Enter base station coordinates:</div>
          <div><CreatePlotJSON onResult={setResult} /></div>
          <div style={sectionHeaderStyle}>Enter Date/Time of Sound</div>
          <RetrieveAudio />
          <RetrievalStatus />
          <div style={sectionHeaderStyle}>Audio File Merging</div>
          <AudioFileList />
          <div style={sectionHeaderStyle}>Measure Time Delay Arrival Offsets</div>
          <div style={{ textAlign: "center" }}>Follow instructions <a href="instructions.html">here</a> to find time delay offsets.</div>
          <div style={sectionHeaderStyle}>Enter measured time delay offsets:</div>
          <div style={sectionHeaderStyle}>(Use 0 .09 .11 .04 for example)</div>
          <div>
            <TDOAParameters
              stations={result?.stations || []}
              onResult={setResult}
            />
          </div>

          {/* Link to System Status Page */}
          <div style={styles.footer}>
            <Link to="/status">Go to System Status</Link>
          </div>
        </div>

        {/* RIGHT MAP PANEL (80%) */}
        <div style={styles.mapContainer}>
          <TDOAMap result={result} />
        </div>
      </div>

      {/* React Router: Define Routes */}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/status" element={<SystemStatus />} /> 
      </Routes>
    </Router>
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
  footer: {
    marginTop: "auto",  
    textAlign: "center",
  }
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
