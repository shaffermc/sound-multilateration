import React from 'react';

function SoundOriginControls({ presetName, onPresetChange, stations, setStations, times, setTimes, setTdoaData }) {

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

  const fetchTdoa = async () => {
    const query = [
      `lat1=${stations[0].lat}`, `lon1=${stations[0].lon}`,
      `lat2=${stations[1].lat}`, `lon2=${stations[1].lon}`,
      `lat3=${stations[2].lat}`, `lon3=${stations[2].lon}`,
      `lat4=${stations[3].lat}`, `lon4=${stations[3].lon}`,
      `tA=${times[0]}`, `tB=${times[1]}`, `tC=${times[2]}`, `tD=${times[3]}`
    ].join('&');

    try {
      const response = await fetch(`http://209.46.124.94:3000/solve_tdoa?${query}`);
      if (!response.ok) throw new Error('TDOA fetch failed');
      const data = await response.json();
      setTdoaData(data);
    } catch (err) {
      console.error(err);
      alert('Error fetching TDOA solution.');
    }
  };

  return (
    <div style={{ padding: '20px', width: '300px', overflowY: 'auto' }}>
      <h3>Coordinate Preset</h3>
      <select value={presetName} onChange={onPresetChange} style={{ marginBottom: '20px', width: '100%' }}>
        <option value="Test Area 1">Test Area 1</option>
        <option value="Test Area 2">Test Area 2</option>
      </select>

      <h3>Stations</h3>
      {stations.map((s, i) => (
        <div key={i} style={{ marginBottom: '10px' }}>
          <strong>Station {String.fromCharCode(65 + i)}</strong>
          <div>Lat: <input type="number" step="0.000001" value={s.lat} onChange={(e) => handleCoordChange(i,'lat',e.target.value)} /></div>
          <div>Lon: <input type="number" step="0.000001" value={s.lon} onChange={(e) => handleCoordChange(i,'lon',e.target.value)} /></div>
        </div>
      ))}

      <h3>Times (s)</h3>
      {times.map((t,i) => (
        <div key={i}>
          t{String.fromCharCode(65+i)}: <input type="number" step="0.01" value={t} onChange={(e) => handleTimeChange(i,e.target.value)} />
        </div>
      ))}

      <button onClick={fetchTdoa} style={{ marginTop: '20px', padding: '10px', width: '100%' }}>Solve TDOA</button>
    </div>
  );
}

export default SoundOriginControls;
