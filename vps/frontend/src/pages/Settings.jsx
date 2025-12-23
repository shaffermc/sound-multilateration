import React, { useState } from "react";
import ESP32Dashboard from "../components/ESP32Dashboard";
import AddInstruction from "../components/AddInstruction";
import InstructionsList from "../components/InstructionsList";
import BandwidthDisplay from "../components/BandwidthDisplay";
import StationStatus from "../components/StationStatus";
import VoltageChart from "../components/VoltageChart";
import { useDeviceSocket } from "../components/useDeviceSocket";

export default function Settings() {
  const [devices, setDevices] = useState({});
  const [stations, setStations] = useState({});

  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  useDeviceSocket(setDevices, setStations);

  return (
    <div style={{ padding: "2rem" }}>
      <AddInstruction />
      <InstructionsList />
      <BandwidthDisplay />
      <StationStatus stations={stations} />
      <ESP32Dashboard devices={devices} />
      <VoltageChart from={from} to={to} interval={10} refreshInterval={60000} />
    </div>
  );
}
