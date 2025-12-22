import ESP32Dashboard from "../components/ESP32Dashboard";
import InstructionsList from "../components/InstructionsList";
import BandwidthDisplay from "../components/BandwidthDisplay";
import StationStatus from "../components/StationStatus";

export default function Settings() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Settings Page</h1>
      <InstructionsList />
      <BandwidthDisplay />
      <StationStatus />
      <ESP32Dashboard />
    </div>
  );
}
