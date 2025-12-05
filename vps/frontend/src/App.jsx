import { useState, useEffect } from 'react';
import './App.css';
import StationStatusTable from './components/StationStatusTable';
import AddInstruction from './components/AddInstruction';
import InstructionsList from './components/InstructionsList';
import AudioFileList from './components/AudioFileList'; 
import SoundOriginLocator from './components/SoundOriginLocator';
import BandwidthDisplay from './components/BandwidthDisplay';  

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <AddInstruction />
      </div>
      <div>
        <InstructionsList /> 
      </div>
      <div>
        <AudioFileList />
      </div>
      <div>
        <SoundOriginLocator /> 
      </div>
    </>
  );
}

export default App;
