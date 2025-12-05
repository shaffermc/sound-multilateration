import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BandwidthDisplay = () => {
  const [bandwidthData, setBandwidthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the list of device names to fetch data for
  const deviceNames = ['1', '2', '3','4'];

  // Function to fetch bandwidth usage data from the API for multiple device names
  const fetchBandwidthData = async () => {
    try {
      const response = await axios.get(
        `http://209.46.124.94:3000/bandwidth/usage?device_names=${deviceNames.join(',')}`
      );
      const data = response.data;

      // Ensure data is sorted by date in descending order (latest first)
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Set the latest record for each device to state
      setBandwidthData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bandwidth data:', err);
      setError('Failed to load bandwidth data');
      setLoading(false);
    }
  };

  // Fetch the data when the component mounts
  useEffect(() => {
    fetchBandwidthData();
  }, []); // Empty dependency array ensures this runs once when the component mounts

  // Format the date for display (e.g., "Jan 19, 2025")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      {bandwidthData && bandwidthData.length > 0 ? (
        <div>
          <table border="1">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>Date</th>
                <th>Daily Upload</th>
                <th>Daily Download</th>
                <th>Total Bandwidth Used</th>
              </tr>
            </thead>
            <tbody>
              {bandwidthData.map((data, index) => (
                <tr key={index}>
                  <td>{data.device_name}</td>
                  <td>{formatDate(data.date)}</td>
                  <td>{data.daily_upload.toFixed(2)} MB</td>
                  <td>{data.daily_download.toFixed(2)} MB</td>
                  <td>{data.total_daily_bandwidth.toFixed(2)} MB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>No bandwidth data available for the selected devices.</div>
      )}
    </div>
  );
};

export default BandwidthDisplay;
