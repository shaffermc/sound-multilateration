import { useState, useEffect } from 'react';
import './App.css';
import SensorTable from './components/SensorTable';  // Import the SensorTable component
import StationStatusTable from './components/StationStatusTable';
import AddInstruction from './components/AddInstruction';
import InstructionsList from './components/InstructionsList';
import AudioFileList from './components/AudioFileList';  // Adjust path if necessary
import SoundOriginLocator from './components/SoundOriginLocator';
import BandwidthDisplay from './components/BandwidthDisplay';  // Ensure the correct path

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <AddInstruction />
      </div>
      <div>
        <InstructionsList /> {/* This will render the InstructionsList without extra whitespaces */}
      </div>
      <div>
        <SensorTable />
      </div>
      <div>
        <StationStatusTable />
      </div>
      <div>
        <BandwidthDisplay />
      </div>
      <div>
        <AudioFileList />
      </div>
      <div>
        <SoundOriginLocator /> {/* This will render the sound origin locator component */}
      </div>
    </>
  );
}

export default App;
