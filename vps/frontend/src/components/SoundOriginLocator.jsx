import { useState, useEffect } from 'react';

function SoundOriginLocator() {

  // --- PRESETS (could later come from your server) ---
  const localPresets = {
    "Test Area 1": {
      coords: [
        { lat: 38.836902, lon: -77.3827},
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

  // When dropdown changes: load new preset
  const handlePresetChange = (e) => {
    const name = e.target.value;
    setPresetName(name);
    setStations(localPresets[name].coords);
    setTimes(localPresets[name].times);
  };

  const [imageUrl, setImageUrl] = useState('');

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

  const fetchPlot = async () => {
    const query = [
      `lat1=${stations[0].lat}`, `lon1=${stations[0].lon}`,
      `lat2=${stations[1].lat}`, `lon2=${stations[1].lon}`,
      `lat3=${stations[2].lat}`, `lon3=${stations[2].lon}`,
      `lat4=${stations[3].lat}`, `lon4=${stations[3].lon}`,
      `tA=${times[0]}`, `tB=${times[1]}`, `tC=${times[2]}`, `tD=${times[3]}`
    ].join('&');

    try {
      const response = await fetch(`http://209.46.124.94:3000/generate_plot?${query}`);
      if (!response.ok) throw new Error('Plot generation failed');
      const data = await response.json();
      setImageUrl(`data:image/png;base64,${data.image}`);
    } catch (err) {
      console.error(err);
      alert('Error generating plot.');
    }
  };

  return (
    <div style={{ display: "flex" }}>
      
      {/* LEFT SIDE — Controls */}
      <div style={{ padding: "20px", overflowY: "auto" }}>

        {/* 🔽 NEW DROPDOWN HERE */}
        <h3>Coordinate Preset</h3>
        <select
          value={presetName}
          onChange={handlePresetChange}
          style={{ marginBottom: "20px", padding: "8px" }}
        >
          {Object.keys(localPresets).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <h3>Station Locations</h3>

        {/* GPS Input Grid */}
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
                  onChange={(e) => handleCoordChange(i, 'lat', e.target.value)}
                  style={{ width: "80px" }}
                />
              </div>
              <div>
                Lon:
                <input
                  type="number"
                  step="0.000001"
                  value={station.lon}
                  onChange={(e) => handleCoordChange(i, 'lon', e.target.value)}
                  style={{ width: "80px" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Time Delays */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <h3>Time Delays</h3>

          {times.map((t, i) => (
            <div key={i}>
              <strong>t{String.fromCharCode(65 + i)}:</strong>
              <input
                type="number"
                step="0.01"
                value={t}
                onChange={(e) => handleTimeChange(i, e.target.value)}
                style={{ width: "80px" }}
              />
              s
            </div>
          ))}
        </div>

        <button
          onClick={fetchPlot}
          style={{ fontSize: '16px', padding: '10px 20px' }}
        >
          Generate Plot
        </button>
      </div>

      {/* RIGHT SIDE — Plot */}
      <div style={{
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderLeft: "2px solid #eee",
        background: "#fafafa"
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt="TDOA Plot" style={{ maxHeight: "500px", maxWidth: "500px", border: "1px solid #ccc" }} />
        ) : (
          <p>No plot yet. Enter coordinates and times, then click "Generate Plot".</p>
        )}
      </div>
    </div>
  );
}

export default SoundOriginLocator;
