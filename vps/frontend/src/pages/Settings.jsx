import ESP32Dashboard from "../components/ESP32Dashboard";
import AddInstruction from "../components/AddInstruction";
import InstructionsList from "../components/InstructionsList";
import BandwidthDisplay from "../components/BandwidthDisplay";
import StationStatus from "../components/StationStatus";
import VoltageChart from "../components/VoltageChart";
import useDeviceSocket from "../components/useDeviceSocket";

export default function Settings() {
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week ago
  const to = new Date().toISOString();

  return (
    <div style={{ padding: "2rem" }}>
      <useDeviceSocket />
      <AddInstruction />
      <InstructionsList />
      <BandwidthDisplay />
      <StationStatus />
      <ESP32Dashboard />
      <VoltageChart from={from} to={to} interval={10} refreshInterval={60000} />
    </div>
  );
}
