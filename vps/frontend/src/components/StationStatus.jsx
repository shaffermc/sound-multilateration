import React, { useEffect, useState } from 'react';

const StationStatus = () => {
  const [stationData, setStationData] = useState([]);  // Array to store data for multiple rows
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to convert minutes into DD:HH:MM format
  const formatUptime = (minutes) => {
    if (minutes === null || minutes === undefined) return 'N/A';
    
    const days = Math.floor(minutes / 1440); // 1440 minutes in a day
    const hours = Math.floor((minutes % 1440) / 60); // Remaining hours after calculating days
    const remainingMinutes = minutes % 60; // Remaining minutes after calculating hours

    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  // Fetch data from the backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://209.46.124.94:3000/stationStatus/get_station_status');
        const data = await response.json();
        console.log("API RESPONSE:", data); 
        setStationData(data);  // Expecting an array of location and status objects
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // If data is still loading, show a loading message
  if (loading) return <div>Loading...</div>;

  // If there's an error fetching data, show an error message
  if (error) return <div>{error}</div>;

  // If no stationData, show a message
  if (stationData.length === 0) return <div>No data available</div>;

return (
  <div>
    <table border="1">
      <thead>
        <tr>
          <th></th>
            {stationData.map((item, index) => {
            const station = item.status;
            return (
            <th key={station._id}>
              S{index + 1}
            </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {/* Timestamp */}
        <tr>
          <th>Last Update</th>
          {stationData.map(item => {
            const ts = new Date(item.status.timestamp);

            if (isNaN(ts.getTime())) {
              return <td key={item.status._id + "_ts"}>Invalid</td>;
            }

            const minutesAgo = Math.floor((Date.now() - ts.getTime()) / 60000);

            return (
              <td key={item.status._id + "_ts"}>
                {minutesAgo}min ago
              </td>
            );
          })}
        </tr>

        {/* Uptime */}
        <tr>
          <th>UT (DD:HH:MM)</th>
          {stationData.map(item => (
            <td key={item.status._id + "_uptime"}>
              {formatUptime(item.status.station_uptime)}
            </td>
          ))}
        </tr>

        {/* Free Space */}
        <tr>
          <th>Free Space</th>
          {stationData.map(item => (
            <td key={item.status._id + "_space"}>
              {item.status.station_free_space || "N/A"}
            </td>
          ))}
        </tr>

        {/* File Count */}
        <tr>
          <th>File Count</th>
          {stationData.map(item => (
            <td key={item.status._id + "_files"}>
              {item.status.station_file_count || "N/A"}
            </td>
          ))}
        </tr>

        {/* Local IP */}
        <tr>
          <th>Local IP</th>
          {stationData.map(item => (
            <td key={item.status._id + "_localip"}>
              {item.status.station_local_ip || "N/A"}
            </td>
          ))}
        </tr>

        {/* Public IP */}
        <tr>
          <th>Public IP</th>
          {stationData.map(item => (
            <td key={item.status._id + "_publicip"}>
              {item.status.station_public_ip || "N/A"}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
);
}
export default StationStatus;
