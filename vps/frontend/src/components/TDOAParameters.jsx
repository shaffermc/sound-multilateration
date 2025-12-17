import { useState } from "react";
import ComputeAndPlotSoundSource from "../assets/6.png"

export default function TDOAParameters({ stations, onResult }) {
  const [times, setTimes] = useState([0, 0, 0, 0]);

  const handleTimeChange = (index, value) => {
    const updated = [...times];
    updated[index] = parseFloat(value);
    setTimes(updated);
  };

  const fetchJSON = async () => {
    const query = [
      `lat1=${stations[0].lat}`, `lon1=${stations[0].lon}`,
      `lat2=${stations[1].lat}`, `lon2=${stations[1].lon}`,
      `lat3=${stations[2].lat}`, `lon3=${stations[2].lon}`,
      `lat4=${stations[3].lat}`, `lon4=${stations[3].lon}`,
      `tA=${times[0]}`, `tB=${times[1]}`, `tC=${times[2]}`, `tD=${times[3]}`
    ].join("&");

    try {
      const res = await fetch(`/sound-locator/api/generate_plot_json?${query}`);
      const data = await res.json();
      onResult(data);
    } catch (err) {
      alert("Error generating JSON");
    }
  };

  return (
    <div style={{ padding: "1px" }}>
      <div style={{ display: "flex", gap: "1px", marginBottom: "1px" }}>
        {times.map((t, i) => (
          <div key={i}>
            <strong>t{String.fromCharCode(65 + i)}:</strong>
            <input
              type="number"
              step="0.01"
              value={t}
              onChange={(e) => handleTimeChange(i, e.target.value)}
              style={{ width: "50px" }}
            />
          </div>
        ))}
      </div>
      <div style={sectionHeaderStyle}>Compute and Plot Sound Location:</div>
      <div style={{ textAlign: "center" }}>
      <button
        onClick={fetchJSON}
        style={{
          fontSize: "16px",
          padding: "6px 10px",
          color: "#000000ff",
          backgroundColor: "#f7f7f7ff",
        }}
        >
        Plot Location on Map
      </button>
     </div>
    </div>
  );

}
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