import { useState, useEffect } from 'react';

function CreatePlotJSON({ onResult }) {

  // -------------------------
  // STATE
  // -------------------------
  const [dbPresets, setDbPresets] = useState([]);     // Loaded from MongoDB
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [newPresetName, setNewPresetName] = useState("");

  const [stations, setStations] = useState([
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 }
  ]);

  const [times, setTimes] = useState([0, 0, 0, 0]);

  // -------------------------
  // LOAD PRESETS FROM DB
  // -------------------------
  const loadPresets = async () => {
    try {
      const res = await fetch("http://209.46.124.94:3000/presets");
      const data = await res.json();
      setDbPresets(data);
    } catch (err) {
      console.error(err);
      alert("Error loading presets from server.");
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  // -------------------------
  // LOAD SELECTED PRESET
  // -------------------------
  const handlePresetChange = (e) => {
    const id = e.target.value;
    setSelectedPresetId(id);

    if (!id) return;

    const preset = dbPresets.find(p => p._id === id);
    if (preset) {
      setStations(preset.coords);
      setTimes(preset.times);
      setNewPresetName(preset.name); // auto-fill name if user wants to overwrite
    }
  };

  // -------------------------
  // MODIFY VALUES
  // -------------------------
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

  const deletePreset = async () => {
  if (!selectedPresetId) {
      alert("No preset selected.");
      return;
  }

  if (!window.confirm("Are you sure you want to delete this preset?")) return;

  try {
      const res = await fetch(`http://209.46.124.94:3000/presets/${selectedPresetId}`, {
      method: "DELETE"
      });

      if (!res.ok) throw new Error("Delete failed.");

      alert("Preset deleted!");

      setSelectedPresetId("");
      setNewPresetName("");
      setStations([
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0 }
      ]);
      setTimes([0, 0, 0, 0]);

      loadPresets(); // refresh dropdown list
  } catch (err) {
      console.error(err);
      alert("Error deleting preset.");
  }
  };


  // -------------------------
  // SAVE TO MONGODB
  // -------------------------
  const savePreset = async () => {
    if (!newPresetName.trim()) {
      alert("Please enter a name for the preset.");
      return;
    }

    try {
      await fetch("http://209.46.124.94:3000/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPresetName,
          coords: stations,
          times: times
        })
      });

      alert("Preset saved!");
      await loadPresets(); // refresh dropdown list
    } catch (err) {
      console.error(err);
      alert("Failed to save preset.");
    }
  };

  // -------------------------
  // GENERATE JSON VIA API
  // -------------------------
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

      {/* LEFT CONTROL PANEL */}
      <div style={{ padding: "20px", overflowY: "auto", maxWidth: "400px" }}>

        {/* LOAD PRESET DROPDOWN */}
        <select
          value={selectedPresetId}
          onChange={handlePresetChange}
          style={{ marginBottom: "20px", padding: "8px", width: "100%" }}
        >
          <option value="">-- Select an Area --</option>
          {dbPresets.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

            {/* COORDINATE INPUTS */}
        <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            marginBottom: '5px'
        }}
        >
        {stations.map((station, i) => (
            <div
            key={i}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '0px 0'
            }}
            >
            <strong>S{String.fromCharCode(65 + i)}</strong>

            <span>Lat:</span>
            <input
                type="number"
                step="0.000001"
                value={station.lat}
                onChange={e => handleCoordChange(i, 'lat', e.target.value)}
                style={{ width: "100px" }}
            />

            <span>Lon:</span>
            <input
                type="number"
                step="0.000001"
                value={station.lon}
                onChange={e => handleCoordChange(i, 'lon', e.target.value)}
                style={{ width: "100px" }}
            />
            </div>
        ))}
        </div>

        {/* TIME INPUTS */}
        Delayed Time of Arrivals
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {times.map((t, i) => (
            <div key={i}>
              <strong>t{String.fromCharCode(65 + i)}:</strong>
              <input
                type="number"
                step="0.01"
                value={t}
                onChange={e => handleTimeChange(i, e.target.value)}
                style={{ width: "50px" }}
              /> 
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* PRESET NAME INPUT */}
        <input
            type="text"
            value={newPresetName}
            onChange={e => setNewPresetName(e.target.value)}
            placeholder="New Preset Name"
            style={{ width: "50%", padding: "8px" }}
        />

        {/* SAVE BUTTON */}
        <button
            onClick={savePreset}
            style={{ fontSize: '12px', padding: '5px 5px' }}
        >
            SAVE
        </button>

        {/* DELETE BUTTON (only show if a preset is selected) */}
        {selectedPresetId && (
            <button
            onClick={deletePreset}
            style={{
                fontSize: '12px',
                padding: '5px 5px',
                backgroundColor: '#d9534f',
                color: 'white'
            }}
            >
            DELETE
            </button>
        )}
        </div>

        <button
          onClick={fetchJSON}
          style={{ 
            fontSize: '16px', 
            padding: '5px 5px',
            backgroundColor: '#b6ffb6',
            color: 'black'
        }}
        >
          Plot Map
        </button>
      </div>
    </div>
  );
}

export default CreatePlotJSON;
