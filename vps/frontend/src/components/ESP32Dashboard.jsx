import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Esp32Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const minutes = 70; // last 10 minutes
        const [eventsRes, dataRes] = await Promise.all([
          axios.get(`/sound-locator/api/esp32/esp32-events/recent-by-time?minutes=${minutes}`),
          axios.get(`/sound-locator/api/esp32/esp32-data/recent-by-time?minutes=${minutes}`),
        ]);

        setEvents(eventsRes.data);
        setSensorData(dataRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch ESP32 data');
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  if (loading) return <p>Loading ESP32 dashboard...</p>;
  if (error) return <p>{error}</p>;

  // Group by device
  const groupByDevice = (arr) => {
    const grouped = {};
    arr.forEach(r => {
      const name = r.esp32_name;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(r);
    });
    return grouped;
  };

  const groupedEvents = groupByDevice(events);
  const groupedData = groupByDevice(sensorData);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>ESP32 Events (last 10 minutes)</h2>
      {Object.keys(groupedEvents).length === 0 ? <p>No events found.</p> :
        Object.entries(groupedEvents).map(([name, readings]) => (
          <div key={name} style={{ marginBottom: '30px' }}>
            <h3>Device: {name}</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Units</th>
                  <th style={thStyle}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{r.esp32_location}</td>
                    <td style={tdStyle}>{r.esp32_event_type}</td>
                    <td style={tdStyle}>{r.esp32_event_value}</td>
                    <td style={tdStyle}>{r.esp32_event_units}</td>
                    <td style={tdStyle}>{new Date(r.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      }

      <h2>ESP32 Sensor Data (last 10 minutes)</h2>
      {Object.keys(groupedData).length === 0 ? <p>No sensor data found.</p> :
        Object.entries(groupedData).map(([name, readings]) => (
          <div key={name} style={{ marginBottom: '30px' }}>
            <h3>Device: {name}</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Sensor</th>
                  <th style={thStyle}>Reading</th>
                  <th style={thStyle}>Units</th>
                  <th style={thStyle}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, idx) => {
                  // Dynamically render all sensor fields
                  const sensorFields = Object.keys(r)
                    .filter(k => k.startsWith('esp32_sensor_') && k !== 'esp32_sensor_units' && k !== 'esp32_sensor_type');

                  return sensorFields.map((field, i) => (
                    <tr key={`${idx}-${i}`}>
                      <td style={tdStyle}>{r.esp32_location}</td>
                      <td style={tdStyle}>{r.esp32_sensor_type}</td>
                      <td style={tdStyle}>{r[field]}</td>
                      <td style={tdStyle}>{r.esp32_sensor_units}</td>
                      <td style={tdStyle}>{new Date(r.timestamp).toLocaleString()}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        ))
      }
    </div>
  );
};

const tableStyle = { borderCollapse: 'collapse', width: '100%' };
const thStyle = { border: '1px solid #ccc', padding: '8px', backgroundColor: '#f0f0f0' };
const tdStyle = { border: '1px solid #ccc', padding: '8px' };

export default Esp32Dashboard;
