import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VoltageChart = ({ refreshInterval = 60000 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected values stored temporarily
  const [selectedDaysBack, setSelectedDaysBack] = useState(1);
  const [selectedInterval, setSelectedInterval] = useState(10);

  // Values actually used for fetching
  const [daysBack, setDaysBack] = useState(1);
  const [interval, setIntervalValue] = useState(10);

  // Fetch data based on current `daysBack` and `interval`
  const fetchVoltageData = async () => {
    const to = new Date();
    const from = new Date(to.getTime() - daysBack * 24 * 60 * 60 * 1000);

    try {
      setLoading(true);
      const res = await axios.get('/sound-locator/api/esp32/esp32-data/voltage-chart', {
        params: { from: from.toISOString(), to: to.toISOString(), interval }
      });
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Initial fetch and interval-based refresh
  useEffect(() => {
    fetchVoltageData();
    const intervalId = setInterval(fetchVoltageData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [daysBack, interval, refreshInterval]);

  if (loading) return <p>Loading voltage chart...</p>;

  const solarData = data.filter(d => d._id.type === 'solar_panel_voltage');
  const batteryData = data.filter(d => d._id.type === 'battery_voltage');
  const labels = solarData.map(d => new Date(d.timestamp).toLocaleString());

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Solar Voltage',
        data: solarData.map(d => d.avgValue),
        borderColor: 'orange',
        backgroundColor: 'rgba(255,165,0,0.2)',
      },
      {
        label: 'Battery Voltage',
        data: batteryData.map(d => d.avgValue),
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.2)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Solar & Battery Voltage` },
    },
    scales: {
      y: { title: { display: true, text: 'Voltage (V)' } },
      x: { title: { display: true, text: 'Time' } }
    }
  };

  // Handle submit button
  const handleSubmit = () => {
    setDaysBack(selectedDaysBack);
    setIntervalValue(selectedInterval);
  };

  return (
    <div>
      <label style={{ marginRight: '1rem' }}>
        Show last: 
        <select
          value={selectedDaysBack}
          onChange={(e) => setSelectedDaysBack(Number(e.target.value))}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value={1}>1 day</option>
          <option value={5}>5 days</option>
          <option value={15}>15 days</option>
        </select>
      </label>

      <label style={{ marginRight: '1rem' }}>
        Interval: 
        <select
          value={selectedInterval}
          onChange={(e) => setSelectedInterval(Number(e.target.value))}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value={10}>10 minutes</option>
          <option value={60}>1 hour</option>
          <option value={360}>6 hours</option>
        </select>
      </label>

      <button onClick={handleSubmit}>Update Chart</button>

      <Line data={chartData} options={options} />
    </div>
  );
};

export default VoltageChart;
