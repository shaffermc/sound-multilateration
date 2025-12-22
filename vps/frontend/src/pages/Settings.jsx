import ESP32Dashboard from "../components/ESP32Dashboard";
import AddInstruction from "../components/AddInstruction";
import InstructionsList from "../components/InstructionsList";
import BandwidthDisplay from "../components/BandwidthDisplay";
import StationStatus from "../components/StationStatus";

export default function Settings() {
  return (
    <div style={{ padding: "2rem" }}>
      <AddInstruction />
      <InstructionsList />
      <BandwidthDisplay />
      <StationStatus />
      <ESP32Dashboard />
    </div>
  );
}
