
import React from 'react';
import StationStatus from "./components/StationStatus";
import BandwidthDisplay from "./components/BandwidthDisplay";
import AddInstruction from "./components/AddInstruction";
import InstructionsList from "./components/InstructionsList";
import Esp32Dashboard from "./components/ESP32Dashboard";

export default function SystemStatus() {

  return (
    <div>
        <div><StationStatus /></div>
        <div><BandwidthDisplay /></div>
        <div><AddInstruction /></div>
        <div><InstructionsList /></div>
        <div><Esp32Dashboard /></div>
    </div>
  );
};

