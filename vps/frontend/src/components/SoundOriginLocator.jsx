import { useState } from "react";
import SoundOriginControls from "./SoundOriginControls";
import SoundOriginMap from "./SoundOriginMap";

export default function SoundOriginLocator() {
  const [stations, setStations] = useState([]);
  const [hyperbolas, setHyperbolas] = useState(null);
  const [solutionPoint, setSolutionPoint] = useState(null);

  const handleGenerate = async (stationsData, times) => {
    // Build query string
    const query = stationsData
      .map((s, i) => `lat${i + 1}=${s.lat}&lon${i + 1}=${s.lon}`)
      .join("&");
    const timeQuery = times
      .map((t, i) => `t${String.fromCharCode(65 + i)}=${t}`)
      .join("&");

    const url = `http://209.46.124.94:3000/solve_tdoa?${query}&${timeQuery}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch");

    const data = await response.json();
    setStations(data.station_coords);
    setHyperbolas(data.hyperbolas);
    setSolutionPoint(data.origin_solution);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <SoundOriginControls onGenerate={handleGenerate} />
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {hyperbolas && solutionPoint ? (
          <SoundOriginMap
            stations={stations}
            hyperbolas={hyperbolas}
            solution={solutionPoint}
          />
        ) : (
          <p>No map data yet. Enter coordinates and times, then click "Generate Map".</p>
        )}
      </div>
    </div>
  );
}
