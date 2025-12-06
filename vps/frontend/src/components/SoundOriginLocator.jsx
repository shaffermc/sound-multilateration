import { useState } from 'react';

function SoundOriginLocator() {
  // ---------------------------
  // Default values (hard-coded)
  // ---------------------------
  const defaultCoords = [
    { lat: 40.75, lon: -73.99 },  // Station A
    { lat: 40.75, lon: -73.9549 },  // Station B
    { lat: 40.77695, lon: -73.9549 },  // Station C
    { lat: 40.77695, lon: -73.9900  },  // Station D
  ];

  const defaultTimes = [0.1, 0.2, .3, .25]; // tA, tB, tC, tD in seconds

  // ---------------------------
  // State
  // ---------------------------
  const [stations, setStations] = useState(defaultCoords);
  const [times, setTimes] = useState(defaultTimes);
  const [imageUrl, setImageUrl] = useState('');

  // ---------------------------
  // Handlers
  // ---------------------------
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
    const timestamp = new Date().getTime(); // prevent caching
    const query = [
      `lat1=${stations[0].lat}`, `lon1=${stations[0].lon}`,
      `lat2=${stations[1].lat}`, `lon2=${stations[1].lon}`,
      `lat3=${stations[2].lat}`, `lon3=${stations[2].lon}`,
      `lat4=${stations[3].lat}`, `lon4=${stations[3].lon}`,
      `tA=${times[0]}`, `tB=${times[1]}`, `tC=${times[2]}`, `tD=${times[3]}`
    ].join('&');
    console.log("Generated URL:", query);
    try {
      const response = await fetch(`http://209.46.124.94:3000/generate_plot?${query}`);
      if (!response.ok) throw new Error('Plot generation failed');
      setImageUrl(`http://209.46.124.94:3000/static/output.png`);
    } catch (err) {
      console.error(err);
      //alert('Error generating plot');
    }
  };

  return (
    <div style={{ width: '100%', padding: '10px' }}>
      <h2>Sound Origin Locator</h2>

      {/* GPS Input Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {stations.map((station, i) => (
          <div key={i} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <strong>Station {String.fromCharCode(65 + i)}</strong>
            <div>
              Lat: <input type="number" step="0.000001" value={station.lat} 
                         onChange={(e) => handleCoordChange(i, 'lat', e.target.value)} />
            </div>
            <div>
              Lon: <input type="number" step="0.000001" value={station.lon} 
                         onChange={(e) => handleCoordChange(i, 'lon', e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      {/* Time Delays */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        {times.map((t, i) => (
          <div key={i}>
            <strong>t{String.fromCharCode(65 + i)}:</strong>
            <input type="number" step="0.01" value={t} 
                   onChange={(e) => handleTimeChange(i, e.target.value)} />
            s
          </div>
        ))}
      </div>

      <button onClick={fetchPlot} style={{ fontSize: '16px', padding: '10px 20px', marginBottom: '20px' }}>
        Generate Plot
      </button>

      {/* Display Plot */}
      <div>
        {imageUrl ? (
          <img src={imageUrl} alt="TDOA Plot" style={{ width: '100%', height: 'auto', border: '1px solid #ccc' }} />
        ) : (
          <p>No plot yet. Enter coordinates and times, then click "Generate Plot".</p>
        )}
      </div>
    </div>
  );
}

export default SoundOriginLocator;
