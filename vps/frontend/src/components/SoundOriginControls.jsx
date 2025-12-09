import { useState } from 'react';

export default function SoundOriginControls({ onGenerate }) {
  const localPresets = {
    "Test Area 1": {
      coords: [
        { lat: 38.836902, lon: -77.3827 },
        { lat: 38.836902, lon: -77.3822 },
        { lat: 38.837799, lon: -77.3822 },
        { lat: 38.837799, lon: -77.3827 },
      ],
      times: [0.09, 0.1, 0.18, 0.19]
    },
    "Test Area 2": {
      coords: [
        { lat: 40.70, lon: -73.90 },
        { lat: 40.72, lon: -73.95 },
        { lat: 40.74, lon: -74.00 },
        { lat: 40.76, lon: -73.98 },
      ],
      times: [0.12, 0.22, 0.28, 0.31]
    }
  };

  const [presetName, setPresetName] = useState("Test Area 1");
  const [stations, setStations] = useState(localPresets[presetName].coords);
  const [times, setTimes] = useState(localPresets[presetName].times);

  const handlePresetChange = (e) => {
    const name = e.target.value;
    setPresetName(name);
    setStations(localPresets[name].coords);
    setTimes(localPresets[name].times);
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

  const handleGenerate = async () => {
    if (!onGenerate) return;
    await onGenerate(stations, times);
  };

  return (
    <div style={{ padding: "20px", overflowY: "auto", minWidth: "300px", borderRight: "1px solid #eee" }}>
      <h3>Coordinate Preset</h3>
      <select value={presetName} onChange={handlePresetChange} style={{ marginBottom: "20px", padding: "8px", width: "100%" }}>
        {Object.keys(localPresets).map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      <h3>Station Locations</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {stations.map((station, i) => (
          <div key={i} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <strong>Station {String.fromCharCode(65 + i)}</strong>
            <div>
              Lat:
              <input type="number" step="0.000001" value={station.lat} onChange={(e) => handleCoordChange(i, 'lat', e.target.value)} style={{ width: "100%" }} />
            </div>
            <div>
              Lon:
              <input type="number" step="0.000001" value={station.lon} onChange={(e) => handleCoordChange(i, 'lon', e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>
        ))}
      </div>

      <h3>Time Delays (s)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {times.map((t, i) => (
          <div key={i}>
            <strong>t{String.fromCharCode(65 + i)}:</strong>
            <input type="number" step="0.01" value={t} onChange={(e) => handleTimeChange(i, e.target.value)} style={{ width: "100%" }} />
          </div>
        ))}
      </div>

      <button onClick={handleGenerate} style={{ fontSize: '16px', padding: '10px 20px', width: '100%' }}>
        Generate Map
      </button>
    </div>
  );
}
