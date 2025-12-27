import { useState, useEffect } from 'react';

function ManagePresets({ onStationsChange, times, onTimesLoad }) {
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
      const res = await fetch('/sound-locator/api/presets');
      const data = await res.json();
      setDbPresets(data);
    } catch (err) {
      alert("Error loading presets.");
    }
  };

  useEffect(() => {
    loadPresets();
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

      // notify parent of new stations
      onStationsChange(preset.coords);

      // load TDOA times for this preset (if present)
      if (preset.times && Array.isArray(preset.times) && preset.times.length === 4) {
        onTimesLoad(preset.times);
      } else {
        // fallback for any old presets without times
        onTimesLoad([0, 0, 0, 0]);
      }
    }
  };

  const handleCoordChange = (index, axis, value) => {
    const updated = [...stations];
    updated[index][axis] = parseFloat(value);
    setStations(updated);

    // also inform parent
    onStationsChange(updated);
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
      await fetch(`/sound-locator/api/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPresetName,
          coords: stations,
          times,              // <-- save current TDOA times
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
      await fetch(`/sound-locator/api/presets/${selectedPresetId}`, {
        method: "DELETE"
      });

      alert("Deleted.");

      setSelectedPresetId("");
      const resetStations = [
        { lat: 0, lon: 0 },
        { lat: 0, lon: 0 },
        { lat: 0, lon: 0 },
        { lat: 0, lon: 0 }
      ];
      setStations(resetStations);
      onStationsChange(resetStations);
      onTimesLoad([0, 0, 0, 0]);
      loadPresets();
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <div style={{
      padding: "1px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <select
        value={selectedPresetId}
        onChange={handlePresetChange}
        style={{ width: "80%", marginBottom: "5px" }}
      >
        <option value="">-- Load Coordinate Preset --</option>
        {dbPresets.map(p => (
          <option key={p._id} value={p._id}>{p.name}</option>
        ))}
      </select>

      {/* STATION COORDINATES ONLY */}
      {stations.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          <strong>{String.fromCharCode(65 + i)}</strong>

          <span>Lat:</span>
          <input
            type="number"
            step="0.0001"
            value={s.lat}
            onChange={e => handleCoordChange(i, 'lat', e.target.value)}
            style={{ width: "80px" }}
          />

          <span>Lon:</span>
          <input
            type="number"
            step="0.0001"
            value={s.lon}
            onChange={e => handleCoordChange(i, 'lon', e.target.value)}
            style={{ width: "80px" }}
          />
        </div>
      ))}

      {/* SAVE / DELETE */}
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <input
          type="text"
          value={newPresetName}
          onChange={e => setNewPresetName(e.target.value)}
          placeholder="Save Preset Name"
          style={{ width: "180px" }}
        />

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={savePreset}
            style={{
              fontSize: "12px",
              padding: "4px 8px",
            }}
          >
            Save
          </button>

          {selectedPresetId && (
            <button
              onClick={deletePreset}
              style={{
                fontSize: "12px",
                padding: "4px 8px"
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagePresets;
