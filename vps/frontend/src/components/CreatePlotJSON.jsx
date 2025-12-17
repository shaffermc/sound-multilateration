import { useState, useEffect } from 'react';

function CreatePlotJSON({ onResult }) {

  const [dbPresets, setDbPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [newPresetName, setNewPresetName] = useState("");

  const [stations, setStations] = useState([
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 },
    { lat: 0, lon: 0 }
  ]);

  // -------------------------
  // LOAD PRESETS
  // -------------------------
  const loadPresets = async () => {
    try {
      const res = await fetch('/presets');
      const data = await res.json();
      setDbPresets(data);
    } catch (err) {
      alert("Error loading presets.");
    }
  };
    useEffect(() => {
    async function load() {
        await loadPresets();
    }
    load();
    }, []);

  // -------------------------
  // SELECT PRESET
  // -------------------------
  const handlePresetChange = (e) => {
    const id = e.target.value;
    setSelectedPresetId(id);

    if (!id) return;

    const preset = dbPresets.find(p => p._id === id);
    if (preset) {
      setStations(preset.coords);
      setNewPresetName(preset.name);

      // ⭐ Send stations to map immediately
      onResult({ stations: preset.coords });
    }
  };

  const handleCoordChange = (index, axis, value) => {
    const updated = [...stations];
    updated[index][axis] = parseFloat(value);
    setStations(updated);

    // ⭐ also send live updates to map
    onResult({ stations: updated });
  };

  // -------------------------
  // SAVE / DELETE PRESET
  // -------------------------
  const savePreset = async () => {
    if (!newPresetName.trim()) {
      alert("Enter a name first.");
      return;
    }

    try {
      await fetch(`/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPresetName,
          coords: stations,
        })
      });

      alert("Preset saved!");
      loadPresets();
    } catch (err) {
      alert("Failed to save.");
    }
  };

  const deletePreset = async () => {
    if (!selectedPresetId) return;

    if (!window.confirm("Delete this preset?")) return;

    try {
      await fetch(`/presets/${selectedPresetId}`, {
        method: "DELETE"
      });

      alert("Deleted.");

      setSelectedPresetId("");
      setStations([{lat:0,lon:0},{lat:0,lon:0},{lat:0,lon:0},{lat:0,lon:0}]);
      loadPresets();
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>

      <select
        value={selectedPresetId}
        onChange={handlePresetChange}
        style={{ width: "100%", marginBottom: "15px" }}
      >
        <option value="">-- Select Area --</option>
        {dbPresets.map(p => (
          <option key={p._id} value={p._id}>{p.name}</option>
        ))}
      </select>

      {/* STATION COORDINATES ONLY */}
      {stations.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          <strong>S{String.fromCharCode(65 + i)}</strong>

          <span>Lat:</span>
          <input
            type="number"
            step="0.000001"
            value={s.lat}
            onChange={e => handleCoordChange(i, 'lat', e.target.value)}
            style={{ width: "80px" }}
          />

          <span>Lon:</span>
          <input
            type="number"
            step="0.000001"
            value={s.lon}
            onChange={e => handleCoordChange(i, 'lon', e.target.value)}
            style={{ width: "80px" }}
          />
        </div>
      ))}

      {/* SAVE / DELETE */}
      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={newPresetName}
          onChange={e => setNewPresetName(e.target.value)}
          placeholder="Preset Name"
        />

        <button onClick={savePreset}>Save</button>

        {selectedPresetId && (
          <button onClick={deletePreset} style={{ background: "red", color: "white" }}>
            Delete
          </button>
        )}
      </div>

    </div>
  );
}

export default CreatePlotJSON;
