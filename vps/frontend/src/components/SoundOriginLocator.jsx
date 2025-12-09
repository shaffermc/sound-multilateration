import React, { useState, useEffect } from 'react';
import SoundOriginMap from './SoundOriginMap';

function SoundOriginLocator() {
  const [tdoaData, setTdoaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTdoa() {
      try {
        const res = await fetch('/api/tdoa'); // replace with your real API endpoint
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setTdoaData(data);
      } catch (err) {
        console.error('Failed to fetch TDOA data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTdoa();
  }, []);

  if (loading) return <div>Loading map data...</div>;
  if (error) return <div>Error: {error}</div>;

  return <SoundOriginMap tdoaData={tdoaData} />;
}

export default SoundOriginLocator;
