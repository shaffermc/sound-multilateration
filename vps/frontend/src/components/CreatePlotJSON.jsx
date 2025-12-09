import { useState } from 'react';

function CreatePlotJSON({ onResult }) {

  const presets = {
    "Test Area 1": {
      coords: [
        { lat: 38.836902, lon: -77.3827 },
        { lat: 38.836902, lon: -77.3822 },
        { lat: 38.837799, lon: -77.3822 },
        { lat: 38.837799, lon: -77.3827 }
      ],
      times: [0.09, 0.10, 0.18, 0.19]
    }
  };

  const [presetName, setPresetName] = useState("Test Area 1");
  const [stations, setStations] = useState(presets[presetName].coords);
  const [times, setTimes] = useState(presets[presetName].times);

  const fetchJSON = async () => {
    const query = [
      `lat1=${stations[0].lat}`, `lon1=${stations[0].lon}`,
      `lat2=${stations[1].lat}`, `lon2=${stations[1].lon}`,
      `lat3=${stations[2].lat}`, `lon3=${stations[2].lon}`,
      `lat4=${stations[3].lat}`, `lon4=${stations[3].lon}`,
      `tA=${times[0]}`, `tB=${times[1]}`, `tC=${times[2]}`, `tD=${times[3]}`
    ].join('&');

    const res = await fetch(`http://209.46.124.94:3000/generate_plot_json?${query}`);
    const data = await res.json();
    onResult(data);   // Send JSON to map component
  };

  return (
    <div>
      <button onClick={fetchJSON} style={{ padding: 10 }}>Generate JSON</button>
    </div>
  );
}

export default CreatePlotJSON;
