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
    },
    "Test Area 2": {
      coords: [
        { lat: 40.70, lon: -73.90 },
        { lat: 40.72, lon: -73.95 },
        { lat: 40.74, lon: -74.00 },
        { lat: 40.76, lon: -73.98 },
      ],
      times: [0.12, 0.22, 0.28, 0.31]
    },
  };

  const [presetName, setPresetName] = useState("Test Area 1");
  const [stations, setStations] = useState(presets[presetName].coords);
  const [times, setTimes] = useState(presets[presetName].times);

  const handlePresetChange = (e) => {
    const name = e.target.value;
    setPresetName(name);
    setStations(presets[name].coords);
    setTimes(presets[name].times);
  };

  const handleCoordChange = (index, axis, value) => {
    const updated = [...stations];
    updated[index][axis] = parseFloat(value);
    setStations(updated);
  };

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
    ].join('&');

    try {
      const res = await fetch(`http://209.46.124.94:3000/generate_plot_json?${query}`);
      if (!res.ok) throw new Error('Failed to generate JSON');
      const data = await res.json();
      onResult(data);
    } catch (err) {
      console.error(err);
      alert('Error fetching JSON data.');
    }
  };

  return (
    <div style={{ display: 'flex' }}>

      {/* LEFT SIDE — Controls */}
      <div style={{ padding: "20px", overflowY: "auto", maxWidth: "400px" }}>

        <h3>Coordinate Preset</h3>
        <select
          value={presetName}
          onChange={handlePresetChange}
          style={{ marginBottom: "20px", padding: "8px" }}
        >
          {Object.keys(presets).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <h3>Station Locations</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {stations.map((station, i) => (
            <div key={i} style={{ border: '1px solid #ccc', padding: '10px' }}>
              <strong>Station {String.fromCharCode(65 + i)}</strong>
              <div>
                Lat:
                <input
                  type="number"
                  step="0.000001"
                  value={station.lat}
                  onChange={e => handleCoordChange(i, 'lat', e.target.value)}
                  style={{ width: "80px" }}
                />
              </div>
              <div>
                Lon:
                <input
                  type="number"
                  step="0.000001"
                  value={station.lon}
                  onChange={e => handleCoordChange(i, 'lon', e.target.value)}
                  style={{ width: "80px" }}
                />
              </div>
            </div>
          ))}
        </div>

        <h3>Time Delays</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {times.map((t, i) => (
            <div key={i}>
              <strong>t{String.fromCharCode(65 + i)}:</strong>
              <input
                type="number"
                step="0.01"
                value={t}
                onChange={e => handleTimeChange(i, e.target.value)}
                style={{ width: "80px" }}
              /> s
            </div>
          ))}
        </div>

        <button
          onClick={fetchJSON}
          style={{ fontSize: '16px', padding: '10px 20px' }}
        >
          Generate JSON
        </button>
      </div>

      {/* RIGHT SIDE — Info / Placeholder */}
      <div style={{
        padding: "20px",
        flex: 1,
        borderLeft: "2px solid #eee",
        background: "#fafafa"
      }}>
      </div>

    </div>
  );
}

export default CreatePlotJSON;
