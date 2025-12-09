import { useState, useEffect } from 'react';
import './App.css';
import StationStatusTable from './components/StationStatusTable';
import AddInstruction from './components/AddInstruction';
import InstructionsList from './components/InstructionsList';
import AudioFileList from './components/AudioFileList'; 
import SoundOriginLocator from './components/SoundOriginLocator';
import CreatePlotLocal from './components/CreatePlotLocal';
import BandwidthDisplay from './components/BandwidthDisplay';  
import RetrieveAudio from './components/RetrieveAudio';
import SoundOriginControls from './components/SoundOriginControls';
import SoundOriginMap from './components/SoundOriginMap';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div><RetrieveAudio /></div>
      <div><CreatePlotLocal /></div>
      <div><SoundOriginLocator /></div>
      <div><InstructionsList /></div>
      <div><AudioFileList /></div>
      <div><StationStatusTable /></div>
      <div><BandwidthDisplay /></div>
      <div><AddInstruction /></div>
    </>
  );
}

export default App;
