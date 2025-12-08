import React, { useEffect, useState } from 'react';

const StationStatusTable = () => {
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
            <th>Timestamp</th>
            <th>Station Location</th>
            <th>Station Uptime (DD:HH:MM)</th>
            <th>Free Space</th>
            <th>File Count</th>
            <th>Local IP</th>
            <th>Public IP</th>
          </tr>
        </thead>
        <tbody>
          {stationData.map((item) => {
            const station = item.status;  // Extract the station data from the response
            // Convert the Unix timestamp to a readable date string
            const timestamp = new Date(station.timestamp);
            const formattedTimestamp = !isNaN(timestamp.getTime()) 
              ? timestamp.toLocaleString() 
              : 'Invalid Date';
            return (
              <tr key={station._id}>
                {/* Display the formatted timestamp */}
                <td>{formattedTimestamp}</td>
                <td>{station.station_location || 'N/A'}</td>
                <td>{formatUptime(station.station_uptime)}</td> {/* Display the formatted uptime */}
                <td>{station.station_free_space || 'N/A'}</td>
                <td>{station.station_file_count || 'N/A'}</td>
                <td>{station.station_local_ip || 'N/A'}</td>
                <td>{station.station_public_ip || 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StationStatusTable;
