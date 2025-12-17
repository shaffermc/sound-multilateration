import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Esp32Dashboard = () => {
  const [latestEvent, setLatestEvent] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        // Fetch latest ESP32 event
        const eventResponse = await axios.get(`/sound-locator/api/esp32/esp32-events/latest`);
        setLatestEvent(eventResponse.data);

        // Fetch latest ESP32 sensor data
        const dataResponse = await axios.get(`/sound-locator/api/esp32/esp32-data/latest`);
        setLatestData(dataResponse.data);

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchLatest();
  }, []);

  if (loading) return <p>Loading latest ESP32 info...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Latest ESP32 Event</h2>
      {latestEvent ? (
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
          <p><strong>Location:</strong> {latestEvent.esp32_location}</p>
          <p><strong>Name:</strong> {latestEvent.esp32_name}</p>
          <p><strong>Event Type:</strong> {latestEvent.esp32_event_type}</p>
          <p><strong>Value:</strong> {latestEvent.esp32_event_value} {latestEvent.esp32_event_units}</p>
          <p><strong>Timestamp:</strong> {new Date(latestEvent.timestamp).toLocaleString()}</p>
        </div>
      ) : (
        <p>No events found.</p>
      )}

      <h2>Latest ESP32 Sensor Data</h2>
      {latestData ? (
        <div style={{ border: '1px solid #ccc', padding: '10px' }}>
          <p><strong>Location:</strong> {latestData.esp32_location}</p>
          <p><strong>Name:</strong> {latestData.esp32_name}</p>
          <p><strong>Sensor Type:</strong> {latestData.esp32_sensor_type}</p>
          <p><strong>Reading:</strong> {latestData.esp32_sensor_reading} {latestData.esp32_sensor_units}</p>
          <p><strong>Timestamp:</strong> {new Date(latestData.timestamp).toLocaleString()}</p>
        </div>
      ) : (
        <p>No sensor data found.</p>
      )}
    </div>
  );
};

export default Esp32Dashboard;
