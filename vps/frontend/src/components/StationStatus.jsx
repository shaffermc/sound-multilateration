import React, { useEffect, useState } from 'react';

const StationStatus = () => {
  const [stationData, setStationData] = useState([]);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert uptime minutes to DD:HH:MM
  const formatUptime = (minutes) => {
    if (minutes === null || minutes === undefined) return 'N/A';
    
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const remainingMinutes = minutes % 60;

    return `${days.toString().padStart(2, '0')}:${hours
      .toString()
      .padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  // Fetch data & update ONLY if timestamps changed
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/sound-locator/api/stationStatus/get_station_status`
        );
        const data = await response.json();

        // Extract timestamps from new data + old data
        const newTimestamps = data.map(item => item?.status?.timestamp);
        const oldTimestamps = stationData.map(item => item?.status?.timestamp);

        // Compare timestamps only
        const timestampsChanged =
          JSON.stringify(newTimestamps) !== JSON.stringify(oldTimestamps);

        // Update only if timestamps changed → avoids table flicker
        if (timestampsChanged) {
          setStationData(data);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    // Initial load
    fetchData();

    // Poll server every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [stationData]);

  // UI behavior
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (stationData.length === 0) return <div>No data available</div>;

  return (
    <div>
      System Status
      <table border="1">
        <thead>
          <tr>
            <th></th>
            {stationData.map((item, index) => {
              const station = item.status;
              return <th key={station._id}>Station {index + 1}</th>;
            })}
          </tr>
        </thead>

        <tbody>
          {/* Timestamp row */}
          <tr>
            <th>Seen</th>
            {stationData.map(item => {
              const ts = new Date(item.status.timestamp);

              if (isNaN(ts.getTime())) {
                return <td key={item.status._id + "_ts"}>Invalid</td>;
              }

              const minutesAgo = Math.floor((Date.now() - ts.getTime()) / 60000);

              return <td key={item.status._id + "_ts"}>{minutesAgo}min ago</td>;
            })}
          </tr>

          {/* Uptime */}
          <tr>
            <th>UT</th>
            {stationData.map(item => (
              <td key={item.status._id + "_uptime"}>
                {formatUptime(item.status.station_uptime)}
              </td>
            ))}
          </tr>

          {/* Free Space */}
          <tr>
            <th>FS</th>
            {stationData.map(item => (
              <td key={item.status._id + "_space"}>
                {item.status.station_free_space || "N/A"}
              </td>
            ))}
          </tr>

          {/* File Count */}
          <tr>
            <th>FC</th>
            {stationData.map(item => (
              <td key={item.status._id + "_files"}>
                {item.status.station_file_count || "N/A"}
              </td>
            ))}
          </tr>

          {/* Local IP */}
          <tr>
            <th>L IP</th>
            {stationData.map(item => (
              <td key={item.status._id + "_localip"}>
                <span style={{ fontSize: "0.75em" }}>{item.status.station_local_ip || "N/A"}</span>
              </td>
            ))}
          </tr>

          {/* Public IP */}
          <tr>
            <th>P IP</th>
            {stationData.map(item => (
              <td key={item.status._id + "_publicip"}>
                <span style={{ fontSize: "0.75em" }}>{item.status.station_public_ip || "N/A"}</span>
              </td>
            ))}
          </tr>

          {/* Future Sensors */}
          <tr>
            <th>T</th>
            <td></td>
          </tr>
          <tr>
            <th>H</th>
            <td></td>
          </tr>
          <tr>
            <th>V</th>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default StationStatus;
