import React, { useState, useEffect } from "react";
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

  useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/sound-locator/api/devices`)
    .then(res => res.json())
    .then(data => {
      const map = {}
      data.forEach(d => {
        map[d.key] = d
      })
      setDevices(map)
    })
    .catch(err => console.error("Failed to load devices", err))
}, [])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/sound-locator/api/stationStatus`)
      .then(res => res.json())
      .then(data => {
        const map = {}
        data.forEach(s => {
          map[s.station] = s
        })
        setStations(map)
      })
      .catch(err => console.error("Failed to load stations", err))
  }, [])

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
