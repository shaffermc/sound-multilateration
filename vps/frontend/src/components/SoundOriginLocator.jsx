import { useState } from 'react';
import SoundOriginControls from './SoundOriginControls';
import SoundOriginMap from './SoundOriginMap';

function SoundOriginLocator() {
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
  const [tdoaData, setTdoaData] = useState(null);

  const handlePresetChange = (e) => {
    const name = e.target.value;
    setPresetName(name);
    setStations(localPresets[name].coords);
    setTimes(localPresets[name].times);
  };

  return (
    <div style={{ display: 'flex' }}>
      <SoundOriginControls
        presetName={presetName}
        onPresetChange={handlePresetChange}
        stations={stations}
        setStations={setStations}
        times={times}
        setTimes={setTimes}
        setTdoaData={setTdoaData}
      />
      <SoundOriginMap tdoaData={tdoaData} />
    </div>
  );
}

export default SoundOriginLocator;
