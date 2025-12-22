import React, { useEffect, useState } from "react";
import axios from "axios";

const Esp32Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest ESP32 events (assume returns array)
        const eventResponse = await axios.get(`/sound-locator/api/esp32/esp32-events/recent`);
        setEvents(eventResponse.data);

        // Fetch latest ESP32 sensor data (assume returns array)
        const dataResponse = await axios.get(`/sound-locator/api/esp32/esp32-data/recent`);
        setData(dataResponse.data);

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch ESP32 data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading ESP32 data...</p>;
  if (error) return <p>{error}</p>;

  // Group by esp32_name and take 2 most recent readings
  const groupByName = (arr) => {
    const map = {};
    arr.forEach((item) => {
      const name = item.esp32_name;
      if (!map[name]) map[name] = [];
      map[name].push(item);
    });
    // Sort each array by timestamp descending and take 2
    for (const key in map) {
      map[key] = map[key]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 2);
    }
    return map;
  };

  const groupedEvents = groupByName(events);
  const groupedData = groupByName(data);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>ESP32 Events (2 Most Recent per Device)</h2>
      {Object.keys(groupedEvents).length === 0 ? (
        <p>No events found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Event Type</th>
              <th style={thStyle}>Value</th>
              <th style={thStyle}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedEvents).map(([name, items]) =>
              items.map((event, idx) => (
                <tr key={`${name}-${idx}`}>
                  <td style={tdStyle}>{event.esp32_name}</td>
                  <td style={tdStyle}>{event.esp32_location}</td>
                  <td style={tdStyle}>{event.esp32_event_type}</td>
                  <td style={tdStyle}>
                    {event.esp32_event_value} {event.esp32_event_units}
                  </td>
                  <td style={tdStyle}>{new Date(event.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <h2>ESP32 Sensor Data (2 Most Recent per Device)</h2>
      {Object.keys(groupedData).length === 0 ? (
        <p>No sensor data found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Sensor Type</th>
              <th style={thStyle}>Reading</th>
              <th style={thStyle}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedData).map(([name, items]) =>
              items.map((item, idx) => (
                <tr key={`${name}-${idx}`}>
                  <td style={tdStyle}>{item.esp32_name}</td>
                  <td style={tdStyle}>{item.esp32_location}</td>
                  <td style={tdStyle}>{item.esp32_sensor_type}</td>
                  <td style={tdStyle}>
                    {item.esp32_sensor_reading} {item.esp32_sensor_units}
                  </td>
                  <td style={tdStyle}>{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Simple table styles
const thStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#f2f2f2",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
};

export default Esp32Dashboard;
