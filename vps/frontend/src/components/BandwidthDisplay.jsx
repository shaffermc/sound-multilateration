import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_BASE_URL;

const BandwidthDisplay = () => {
  const [bandwidthData, setBandwidthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The station_ids you want to query
  const stationNames = ['1', '2', '3', '4'];

  const fetchBandwidthData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/bandwidth/usage?station_id=${stationNames.join(',')}`
      );
      const data = response.data;

      // Sort by date (newest first)
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      setBandwidthData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bandwidth data:', err);
      setError('Failed to load bandwidth data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBandwidthData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {bandwidthData && bandwidthData.length > 0 ? (
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
                <td>{data.station_id}</td>
                <td>{formatDate(data.date)}</td>
                <td>{data.daily_upload.toFixed(2)} MB</td>
                <td>{data.daily_download.toFixed(2)} MB</td>
                <td>{data.total_daily_bandwidth.toFixed(2)} MB</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No bandwidth data available for the selected devices.</div>
      )}
    </div>
  );
};

export default BandwidthDisplay;
